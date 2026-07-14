import { PitchEnd, PlayerRole } from "../../src/generated/prisma/enums.js";
import generateBall, {
  getRandomByPercentage,
  type PercentageOption,
  type RandomSource,
} from "./generate-ball.js";
import type { ballType, matchInning } from "./generate-matchData.js";

type BowlingPlayer = {
  value: string;
  role: Exclude<PlayerRole, "BATSMAN">;
};

const generateBowlingPlayerPercentage = <T extends string>(
  players: readonly {
    value: T;
    role: Exclude<PlayerRole, "BATSMAN">;
  }[],
): readonly PercentageOption<T>[] => {
  if (players.length === 0) {
    throw new Error("Bowling players cannot be empty.");
  }

  const bowlerCount = players.filter(
    (player) => player.role === "BOWLER",
  ).length;

  const allRounderCount = players.filter(
    (player) => player.role === "ALL_ROUNDER",
  ).length;

  const hasBothRoles = bowlerCount > 0 && allRounderCount > 0;

  const bowlerPool = bowlerCount === 0 ? 0 : hasBothRoles ? 75 : 100;

  const allRounderPool = allRounderCount === 0 ? 0 : hasBothRoles ? 25 : 100;

  const options: PercentageOption<T>[] = players.map((player) => ({
    value: player.value,
    percentage:
      player.role === "BOWLER"
        ? bowlerPool / bowlerCount
        : allRounderPool / allRounderCount,
  }));

  const currentTotal = options.reduce(
    (sum, option) => sum + option.percentage,
    0,
  );

  const lastOption = options.at(-1);

  if (!lastOption) {
    throw new Error("Bowling players cannot be empty.");
  }

  return options.map((option, index) =>
    index === options.length - 1
      ? {
          ...option,
          percentage: option.percentage + (100 - currentTotal),
        }
      : option,
  );
};

const buildBowlingPlan = (
  players: readonly BowlingPlayer[],
  overs: number,
  maxBowlerOvers: number,
  random: RandomSource,
): string[] => {
  const usedOvers = new Map(players.map((player) => [player.value, 0]));

  const plan: string[] = [];

  const search = (): boolean => {
    if (plan.length === overs) {
      return true;
    }

    const previousBowlerId = plan.at(-1);

    const candidates = players.filter(
      (player) =>
        player.value !== previousBowlerId &&
        (usedOvers.get(player.value) ?? 0) < maxBowlerOvers,
    );

    const remainingCandidates = [...candidates];

    while (remainingCandidates.length > 0) {
      const options = generateBowlingPlayerPercentage(remainingCandidates);

      const selectedBowlerId = getRandomByPercentage(options, random);

      const selectedIndex = remainingCandidates.findIndex(
        (player) => player.value === selectedBowlerId,
      );

      const selectedPlayer = remainingCandidates[selectedIndex];

      if (!selectedPlayer) {
        throw new Error("Selected bowler was not found.");
      }

      remainingCandidates.splice(selectedIndex, 1);

      plan.push(selectedBowlerId);

      usedOvers.set(
        selectedBowlerId,
        (usedOvers.get(selectedBowlerId) ?? 0) + 1,
      );

      if (search()) {
        return true;
      }

      plan.pop();

      usedOvers.set(
        selectedBowlerId,
        (usedOvers.get(selectedBowlerId) ?? 1) - 1,
      );
    }

    return false;
  };

  if (!search()) {
    throw new Error(
      "Unable to create a valid bowling plan with the supplied limits.",
    );
  }

  return plan;
};

export const generateBalls = (
  matchInning: matchInning,
  battingPlayers: readonly string[],
  bowlingPlayers: readonly BowlingPlayer[],
  wicketKeeperMatchPlayerId: string,
  fielders: readonly string[],
  maxBowlerOvers: number,
  startId: number,
  random: RandomSource = Math.random,
): ballType[] => {
  const overs = matchInning.maxOvers;
  const inningId = matchInning.id;

  if (!inningId.trim()) {
    throw new Error("Inning ID cannot be empty.");
  }

  if (!Number.isInteger(overs) || overs <= 0) {
    throw new Error("maxOvers must be a positive integer.");
  }

  if (!Number.isInteger(maxBowlerOvers) || maxBowlerOvers <= 0) {
    throw new Error("maxBowlerOvers must be a positive integer.");
  }

  if (!Number.isInteger(startId) || startId <= 0) {
    throw new Error("startId must be a positive integer.");
  }

  if (
    matchInning.target !== null &&
    (!Number.isInteger(matchInning.target) || matchInning.target <= 0)
  ) {
    throw new Error("Innings target must be a positive integer when provided.");
  }

  if (battingPlayers.length < 2) {
    throw new Error("At least two batting players are required.");
  }

  if (bowlingPlayers.length === 0) {
    throw new Error("At least one bowling player is required.");
  }

  if (overs > 1 && bowlingPlayers.length < 2) {
    throw new Error(
      "At least two bowling players are required for multiple overs.",
    );
  }

  if (!wicketKeeperMatchPlayerId.trim()) {
    throw new Error("Wicketkeeper player ID cannot be empty.");
  }

  if (battingPlayers.some((playerId) => !playerId.trim())) {
    throw new Error("Batting player IDs cannot be empty.");
  }

  if (bowlingPlayers.some((player) => !player.value.trim())) {
    throw new Error("Bowling player IDs cannot be empty.");
  }

  if (fielders.some((playerId) => !playerId.trim())) {
    throw new Error("Fielder IDs cannot be empty.");
  }

  if (new Set(battingPlayers).size !== battingPlayers.length) {
    throw new Error("Batting players cannot contain duplicates.");
  }

  const bowlingPlayerIds = bowlingPlayers.map((player) => player.value);

  if (bowlingPlayerIds.includes(wicketKeeperMatchPlayerId)) {
    throw new Error(
      "The wicketkeeper cannot be included in the bowling players.",
    );
  }

  if (new Set(bowlingPlayerIds).size !== bowlingPlayerIds.length) {
    throw new Error("Bowling players cannot contain duplicates.");
  }

  if (new Set(fielders).size !== fielders.length) {
    throw new Error("Fielders cannot contain duplicates.");
  }

  if (!fielders.includes(wicketKeeperMatchPlayerId)) {
    throw new Error("Fielders must include the wicketkeeper.");
  }

  for (const bowlingPlayerId of bowlingPlayerIds) {
    if (!fielders.includes(bowlingPlayerId)) {
      throw new Error(
        `Bowling player "${bowlingPlayerId}" must be included in fielders.`,
      );
    }
  }

  const battingPlayerIdSet = new Set(battingPlayers);

  if (fielders.some((fielderId) => battingPlayerIdSet.has(fielderId))) {
    throw new Error("Batting players cannot be included in fielders.");
  }

  const totalPossibleOvers = bowlingPlayers.length * maxBowlerOvers;

  if (totalPossibleOvers < overs) {
    throw new Error("Not enough bowling capacity to complete the innings.");
  }

  const bowlingPlan = buildBowlingPlan(
    bowlingPlayers,
    overs,
    maxBowlerOvers,
    random,
  );

  const balls: ballType[] = [];

  let newId = startId;
  let deliveryNo = 1;
  let currentBallIsFreeHit = false;
  let inningRuns = 0;

  let strikerIndex = 0;
  let nonStrikerIndex = 1;
  let nextBatterIndex = 2;

  const swapStrike = (): void => {
    [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
  };

  overLoop: for (let overNo = 0; overNo < overs; overNo++) {
    // Batters change ends after a completed over.
    if (overNo > 0) {
      swapStrike();
    }

    const bowlerMatchPlayerId = bowlingPlan[overNo];

    if (!bowlerMatchPlayerId) {
      throw new Error(`Missing bowler for over ${overNo}.`);
    }

    let legalBallNo = 1;
    let deliveryEventsInOver = 0;

    while (legalBallNo <= 6) {
      deliveryEventsInOver++;

      // Safety against an injected RNG that generates
      // endless Wides or No-balls.
      if (deliveryEventsInOver > 100) {
        throw new Error(
          `Over ${overNo} exceeded 100 delivery events without completing.`,
        );
      }

      const strikerIdBeforeBall = battingPlayers[strikerIndex];

      const nonStrikerIdBeforeBall = battingPlayers[nonStrikerIndex];

      if (!strikerIdBeforeBall || !nonStrikerIdBeforeBall) {
        throw new Error("Current batters could not be resolved.");
      }

      const ball: ballType = {
        ...generateBall(
          inningId,
          deliveryNo,
          overNo,
          legalBallNo,
          currentBallIsFreeHit,
          strikerIdBeforeBall,
          nonStrikerIdBeforeBall,
          bowlerMatchPlayerId,
          wicketKeeperMatchPlayerId,
          fielders,
          random,
        ),
        id: String(newId),
      };

      balls.push(ball);

      newId++;
      deliveryNo++;

      if (ball.isLegalDelivery) {
        legalBallNo++;
      }

      // No-ball always creates a Free hit.
      // A Wide during a Free hit keeps the Free hit active.
      currentBallIsFreeHit = ball.isNoBall || (ball.isFreeHit && ball.isWide);

      inningRuns += ball.totalRuns;

      // Stop the chase once the target is reached.
      if (matchInning.target !== null && inningRuns >= matchInning.target) {
        break overLoop;
      }

      // Runs that affect which physical ends the batters occupy.
      // The automatic Wide penalty does not change ends.
      const runningRuns =
        ball.batterRuns +
        ball.byeRuns +
        ball.legByeRuns +
        (ball.isWide ? ball.wideRuns - 1 : 0);

      if (ball.isWicket) {
        const dismissedPlayerId = ball.dismissedMatchPlayerId;

        if (!dismissedPlayerId) {
          throw new Error(
            "Wicket delivery must contain dismissedMatchPlayerId.",
          );
        }

        let survivorIndex: number;

        if (dismissedPlayerId === strikerIdBeforeBall) {
          survivorIndex = nonStrikerIndex;
        } else if (dismissedPlayerId === nonStrikerIdBeforeBall) {
          survivorIndex = strikerIndex;
        } else {
          throw new Error(
            "Dismissed player is not one of the current batters.",
          );
        }

        let dismissedEnd: PitchEnd;

        if (ball.dismissalType === "RUN_OUT") {
          if (!ball.runOutEnd) {
            throw new Error("Run-out delivery must contain runOutEnd.");
          }

          dismissedEnd = ball.runOutEnd;
        } else {
          const changedEnds = runningRuns % 2 !== 0;

          const playerAtStrikerEnd = changedEnds
            ? nonStrikerIdBeforeBall
            : strikerIdBeforeBall;

          dismissedEnd =
            dismissedPlayerId === playerAtStrikerEnd
              ? "STRIKER_END"
              : "BOWLER_END";
        }

        // No unused batter remains: innings is all out.
        if (nextBatterIndex >= battingPlayers.length) {
          break overLoop;
        }

        const incomingBatterIndex = nextBatterIndex;
        nextBatterIndex++;

        if (dismissedEnd === "STRIKER_END") {
          strikerIndex = incomingBatterIndex;
          nonStrikerIndex = survivorIndex;
        } else {
          strikerIndex = survivorIndex;
          nonStrikerIndex = incomingBatterIndex;
        }
      } else if (runningRuns % 2 !== 0) {
        swapStrike();
      }
    }
  }

  return balls;
};
