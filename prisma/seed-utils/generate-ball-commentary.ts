import type {
  DeadBallReason,
  NoBallReason,
  PenaltyRunReason,
  PitchEnd,
  WideReason,
} from "../../src/generated/prisma/enums.js";

import matchPlayers from "../seed-data/matchPlayers.js";
import players from "../seed-data/players.js";
import type { GeneratedBall } from "./generate-ball.js";

/*
 * The low-level generateBall() result does not contain an ID.
 * Commentary is generated after generate-balls.ts assigns the final ball ID.
 */
export type BallBeforeCommentary = GeneratedBall & {
  id: string;
};

/*
|--------------------------------------------------------------------------
| Player-name lookup
|--------------------------------------------------------------------------
|
| Ball fields contain MatchPlayer IDs:
|
| Ball.strikerMatchPlayerId
|          ↓
| MatchPlayer.id
|          ↓
| MatchPlayer.playerId
|          ↓
| Player.id
|          ↓
| Player.displayName || Player.playerName
|
| These maps are built once when this module loads. They are not rebuilt for
| every delivery, and no database query is required.
|
*/

const playerById = new Map(players.map((player) => [player.id, player]));

const playerNameByMatchPlayerId = new Map<string, string>();

for (const matchPlayer of matchPlayers) {
  if (playerNameByMatchPlayerId.has(matchPlayer.id)) {
    throw new Error(
      `Duplicate match-player ID "${matchPlayer.id}" found while building commentary player lookup.`,
    );
  }

  const player = playerById.get(matchPlayer.playerId);

  if (!player) {
    throw new Error(
      `Match-player "${matchPlayer.id}" references unknown player "${matchPlayer.playerId}".`,
    );
  }

  const resolvedName = player.displayName?.trim() || player.playerName.trim();

  if (!resolvedName) {
    throw new Error(
      `Player "${player.id}" does not have a valid commentary name.`,
    );
  }

  playerNameByMatchPlayerId.set(matchPlayer.id, resolvedName);
}

const getRequiredPlayerName = (matchPlayerId: string): string => {
  const playerName = playerNameByMatchPlayerId.get(matchPlayerId);

  if (!playerName) {
    throw new Error(
      `Player name could not be resolved for match-player "${matchPlayerId}".`,
    );
  }

  return playerName;
};

const getOptionalPlayerName = (matchPlayerId: string | null): string | null => {
  return matchPlayerId ? getRequiredPlayerName(matchPlayerId) : null;
};

/*
|--------------------------------------------------------------------------
| Formatting helpers
|--------------------------------------------------------------------------
*/

const formatCount = (
  amount: number,
  singular: string,
  plural: string,
): string => {
  return `${amount} ${amount === 1 ? singular : plural}`;
};

const formatNaturalList = (items: readonly string[]): string => {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  const finalItem = items[items.length - 1];
  const initialItems = items.slice(0, -1);

  return `${initialItems.join(", ")}, and ${finalItem}`;
};

const wideReasonDescriptions = {
  OUTSIDE_OFF: "outside off",
  DOWN_LEG: "down leg",
  TOO_FAR_FROM_BATTER: "too far from the batter",
  OTHER: null,
} satisfies Readonly<Record<WideReason, string | null>>;

const noBallReasonDescriptions = {
  OVERSTEP: "overstepping",
  BACK_FOOT_FAULT: "a back-foot fault",
  ILLEGAL_ACTION: "an illegal bowling action",
  UNDERARM: "an underarm delivery",
  BOUNCES_MORE_THAN_ONCE: "the ball bouncing more than once",
  ROLLING_BALL: "a rolling ball",
  PITCHED_OFF_PITCH: "the ball pitching off the pitch",
  BALL_COMES_TO_REST: "the ball coming to rest",
  BOUNCER_OVER_HEAD: "a bouncer over head height",
  HIGH_FULL_TOSS: "a high full toss",
  TOO_MANY_BOUNCERS: "too many bouncers",
  DANGEROUS_BOWLING: "dangerous bowling",
  BOWLER_BREAKS_WICKET: "the bowler breaking the wicket",
  FIELDER_INTERCEPTS_DELIVERY: "a fielder intercepting the delivery",
  WICKET_KEEPER_POSITION: "an illegal wicketkeeper position",
  FIELDING_RESTRICTION: "a fielding-restriction violation",
  OTHER: "another reason",
} satisfies Readonly<Record<NoBallReason, string>>;

const deadBallReasonDescriptions = {
  OUTSIDE_PERSON_ON_FIELD: "as an outside person was on the field",
  BATTER_DISTRACTED: "as the batter was distracted",
  PLAYER_INJURY: "due to a player injury",
  BALL_NOT_DELIVERED: "as the ball was not delivered",
  UMPIRE_INTERVENTION: "due to umpire intervention",
  BALL_COMES_TO_REST_BEFORE_STRIKER:
    "as the ball came to rest before reaching the striker",
  FIELDER_INTERCEPTS_DELIVERY: "after a fielder intercepted the delivery",
  OTHER: "for another reason",
} satisfies Readonly<Record<DeadBallReason, string>>;

const penaltyReasonDescriptions = {
  BALL_HIT_HELMET_ON_GROUND: "the ball hitting a helmet on the ground",
  FAKE_FIELDING: "fake fielding",
  DELIBERATE_SHORT_RUN: "a deliberate short run",
  BALL_TAMPERING: "ball tampering",
  TIME_WASTING: "time wasting",
  PLAYER_MISCONDUCT: "player misconduct",
  FIELDING_RESTRICTION: "a fielding-restriction violation",
  PITCH_DAMAGE: "pitch damage",
  OTHER: "another reason",
} satisfies Readonly<Record<PenaltyRunReason, string>>;

const runOutEndDescriptions = {
  STRIKER_END: "at the striker's end",
  BOWLER_END: "at the bowler's end",
} satisfies Readonly<Record<PitchEnd, string>>;

/*
 * These immediate dead-ball reasons correspond directly to a no-ball reason.
 * Filter the duplicate no-ball reason so commentary does not say:
 *
 * "no ball for the ball coming to rest, dead ball as the ball came to rest..."
 */
const duplicatedNoBallReasonByDeadBallReason: Partial<
  Record<DeadBallReason, NoBallReason>
> = {
  BALL_COMES_TO_REST_BEFORE_STRIKER: "BALL_COMES_TO_REST",
  FIELDER_INTERCEPTS_DELIVERY: "FIELDER_INTERCEPTS_DELIVERY",
};

const formatWideFragment = (
  wideRuns: number,
  wideReason: WideReason | null,
): string => {
  const baseText = wideRuns === 1 ? "wide" : `${wideRuns} wides`;

  if (!wideReason) {
    return baseText;
  }

  const reasonText = wideReasonDescriptions[wideReason];

  if (!reasonText) {
    return baseText;
  }

  return wideRuns === 1
    ? `${baseText} ${reasonText}`
    : `${baseText}, ${reasonText}`;
};

const formatNoBallFragment = (
  reasons: readonly NoBallReason[],
  deadBallReason: DeadBallReason | null,
): string => {
  const duplicateReason = deadBallReason
    ? duplicatedNoBallReasonByDeadBallReason[deadBallReason]
    : undefined;

  const uniqueReasons = [
    ...new Set(reasons.filter((reason) => reason !== duplicateReason)),
  ];

  if (uniqueReasons.length === 0) {
    return "no ball";
  }

  const reasonTexts = uniqueReasons.map(
    (reason) => noBallReasonDescriptions[reason],
  );

  return `no ball for ${formatNaturalList(reasonTexts)}`;
};

const formatDeadBallFragment = (reason: DeadBallReason): string => {
  return `dead ball ${deadBallReasonDescriptions[reason]}`;
};

const formatPenaltyFragment = (
  penaltyRuns: number,
  reason: PenaltyRunReason | null,
): string => {
  const baseText = formatCount(penaltyRuns, "penalty run", "penalty runs");

  return reason
    ? `${baseText} for ${penaltyReasonDescriptions[reason]}`
    : baseText;
};

/*
|--------------------------------------------------------------------------
| Consistency validation
|--------------------------------------------------------------------------
*/

const assertCommentaryBallConsistency = (ball: BallBeforeCommentary): void => {
  const calculatedExtraRuns =
    ball.noBallRuns +
    ball.wideRuns +
    ball.byeRuns +
    ball.legByeRuns +
    ball.penaltyRuns;

  const calculatedTotalRuns = ball.batterRuns + calculatedExtraRuns;

  if (ball.extraRuns !== calculatedExtraRuns) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": extraRuns is inconsistent.`,
    );
  }

  if (ball.totalRuns !== calculatedTotalRuns) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": totalRuns is inconsistent.`,
    );
  }

  if (ball.isWide && ball.isNoBall) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": a delivery cannot be both Wide and No-ball.`,
    );
  }

  if (ball.isWicket !== (ball.dismissalType !== null)) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": wicket fields are inconsistent.`,
    );
  }

  if (ball.isWicket && !ball.dismissedMatchPlayerId) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": a wicket must have a dismissed player.`,
    );
  }

  if (!ball.isWicket && ball.dismissedMatchPlayerId !== null) {
    throw new Error(
      `Cannot generate commentary for ball "${ball.id}": a non-wicket delivery cannot have a dismissed player.`,
    );
  }
};

/*
|--------------------------------------------------------------------------
| Wicket commentary
|--------------------------------------------------------------------------
*/

const formatDismissalFragment = (
  ball: BallBeforeCommentary,
  bowlerName: string,
): string | null => {
  if (!ball.isWicket) {
    return null;
  }

  if (!ball.dismissalType || !ball.dismissedMatchPlayerId) {
    throw new Error(
      `Wicket delivery "${ball.id}" is missing dismissal information.`,
    );
  }

  const dismissedName = getRequiredPlayerName(ball.dismissedMatchPlayerId);

  const fielderName = getOptionalPlayerName(ball.fielderMatchPlayerId);

  const assistFielderName = getOptionalPlayerName(
    ball.assistFielderMatchPlayerId,
  );

  switch (ball.dismissalType) {
    case "BOWLED":
      return `OUT! ${dismissedName} is bowled by ${bowlerName}`;

    case "CAUGHT": {
      if (!fielderName) {
        throw new Error(
          `Caught dismissal on ball "${ball.id}" must have a fielder.`,
        );
      }

      if (ball.fielderMatchPlayerId === ball.bowlerMatchPlayerId) {
        return assistFielderName
          ? `OUT! ${dismissedName} is caught and bowled by ${bowlerName}, assisted by ${assistFielderName}`
          : `OUT! ${dismissedName} is caught and bowled by ${bowlerName}`;
      }

      return assistFielderName
        ? `OUT! ${dismissedName} is caught by ${fielderName}, assisted by ${assistFielderName}, off ${bowlerName}`
        : `OUT! ${dismissedName} is caught by ${fielderName} off ${bowlerName}`;
    }

    case "LBW":
      return `OUT! ${dismissedName} is lbw to ${bowlerName}`;

    case "RUN_OUT": {
      if (!fielderName) {
        throw new Error(
          `Run-out dismissal on ball "${ball.id}" must have a fielder.`,
        );
      }

      const endText = ball.runOutEnd
        ? ` ${runOutEndDescriptions[ball.runOutEnd]}`
        : "";

      return assistFielderName
        ? `OUT! ${dismissedName} is run out${endText} by ${fielderName}, with assistance from ${assistFielderName}`
        : `OUT! ${dismissedName} is run out${endText} by ${fielderName}`;
    }

    case "STUMPED":
      if (!fielderName) {
        throw new Error(
          `Stumped dismissal on ball "${ball.id}" must have a wicketkeeper.`,
        );
      }

      return `OUT! ${dismissedName} is stumped by ${fielderName} off ${bowlerName}`;

    case "HIT_WICKET":
      return `OUT! ${dismissedName} is hit wicket off ${bowlerName}`;

    case "HIT_BALL_TWICE":
      return `OUT! ${dismissedName} hit the ball twice`;

    case "OBSTRUCTING_FIELD":
      return `OUT! ${dismissedName} is out obstructing the field`;

    case "TIMED_OUT":
      return `OUT! ${dismissedName} is timed out`;

    case "RETIRED_OUT":
      return `OUT! ${dismissedName} is retired out`;
  }
};

/*
|--------------------------------------------------------------------------
| Public commentary generator
|--------------------------------------------------------------------------
*/

export const generateBallCommentary = (ball: BallBeforeCommentary): string => {
  assertCommentaryBallConsistency(ball);

  const bowlerName = getRequiredPlayerName(ball.bowlerMatchPlayerId);

  const strikerName = getRequiredPlayerName(ball.strikerMatchPlayerId);

  const prefix = `${bowlerName} to ${strikerName}`;
  const fragments: string[] = [];

  if (ball.isFreeHit) {
    fragments.push("free hit");
  }

  /*
   * Delivery extras.
   */
  if (ball.isWide) {
    fragments.push(formatWideFragment(ball.wideRuns, ball.wideReason));
  }

  if (ball.isNoBall) {
    fragments.push(
      formatNoBallFragment(ball.noBallReasons, ball.deadBallReason),
    );
  }

  if (ball.isDeadBall) {
    if (!ball.deadBallReason) {
      throw new Error(
        `Dead-ball delivery "${ball.id}" must contain a deadBallReason.`,
      );
    }

    fragments.push(formatDeadBallFragment(ball.deadBallReason));
  }

  /*
   * Batter runs.
   */
  if (ball.isFour) {
    fragments.push("FOUR");
  } else if (ball.isSix) {
    fragments.push("SIX");
  } else if (ball.batterRuns === 4) {
    fragments.push("4 runs completed");
  } else if (ball.batterRuns > 0) {
    const batterRunsText = formatCount(ball.batterRuns, "run", "runs");

    fragments.push(
      ball.isNoBall ? `${batterRunsText} from the bat` : batterRunsText,
    );
  }

  /*
   * Other extras. These may appear together with a No-ball.
   */
  if (ball.byeRuns > 0) {
    fragments.push(formatCount(ball.byeRuns, "bye", "byes"));
  }

  if (ball.legByeRuns > 0) {
    fragments.push(formatCount(ball.legByeRuns, "leg bye", "leg byes"));
  }

  if (ball.penaltyRuns > 0) {
    fragments.push(
      formatPenaltyFragment(ball.penaltyRuns, ball.penaltyRunReason),
    );
  }

  /*
   * Wicket fragment is appended after completed runs and extras.
   *
   * Example:
   * "2 wides, OUT! Batter is run out..."
   */
  const dismissalFragment = formatDismissalFragment(ball, bowlerName);

  if (dismissalFragment) {
    fragments.push(dismissalFragment);
  }

  if (fragments.length === 0) {
    fragments.push("no run");
  }

  const commentary = `${prefix}, ${fragments.join(", ")}.`;

  if (!commentary.trim()) {
    throw new Error(`Commentary could not be generated for ball "${ball.id}".`);
  }

  return commentary;
};

export default generateBallCommentary;
