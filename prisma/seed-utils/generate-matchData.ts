import {
  DeadBallReason,
  DismissalType,
  MatchInningNo,
  MatchInningStatus,
  MatchStatus,
  NoBallReason,
  PenaltyRunReason,
  PitchEnd,
  TossDecision,
  WideReason,
} from "../../src/generated/prisma/enums.js";
import type { matchType } from "../seed-data/matches.js";
import type { matchPlayerType } from "../seed-data/matchPlayers.js";
import players from "../seed-data/players.js";
import type { RandomSource } from "./generate-ball.js";
import { generateBalls } from "./generate-balls.js";

export type matchInning = {
  id: string;
  matchId: string;
  teamId: string;
  inningsNo: MatchInningNo;
  runs: number;
  wickets: number;
  balls: number;
  maxOvers: number;
  status: MatchInningStatus;
  target: number | null;
};

export type ballType = {
  id: string;
  inningId: string;
  deliveryNo: number;
  overNo: number;
  ballNo: number;
  strikerMatchPlayerId: string;
  nonStrikerMatchPlayerId: string;
  bowlerMatchPlayerId: string;
  isLegalDelivery: boolean;
  isFreeHit: boolean;
  isDotBall: boolean;
  isFour: boolean;
  isSix: boolean;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isPenalty: boolean;
  isDeadBall: boolean;
  deadBallReason: DeadBallReason | null;
  noBallReasons: NoBallReason[];
  wideReason: WideReason | null;
  penaltyRunReason: PenaltyRunReason | null;
  batterRuns: number;
  noBallRuns: number;
  wideRuns: number;
  byeRuns: number;
  legByeRuns: number;
  penaltyRuns: number;
  extraRuns: number;
  totalRuns: number;
  isWicket: boolean;
  dismissalType: DismissalType | null;
  runOutEnd: PitchEnd | null;
  dismissedMatchPlayerId: string | null;
  fielderMatchPlayerId: string | null;
  assistFielderMatchPlayerId: string | null;
  commentaryText: string;
};

type BowlingRole = "BOWLER" | "ALL_ROUNDER";

type BowlingPlayer = {
  value: string;
  role: BowlingRole;
};

export type MatchGenerationOptions = {
  readonly maxOvers?: number;
  readonly maxBowlerOvers?: number;
  readonly expectedPlayingPlayersPerTeam?: number | null;
  readonly inningIdStart?: number;
  readonly ballIdStart?: number;
  readonly random?: RandomSource;
};

type GeneratedMatchData = {
  matchInningsData: matchInning[];
  matchPlayersData: matchPlayerType[];
  ballsData: ballType[];
};

type ConsecutiveWicketMilestones = {
  twoWicketsInTwoBalls: number;
  hatTricks: number;
  fourWicketsInFourBalls: number;
  fiveWicketsInFiveBalls: number;
  sixWicketsInSixBalls: number;
};

const bowlerCreditedDismissals = new Set<
  NonNullable<ballType["dismissalType"]>
>(["BOWLED", "CAUGHT", "LBW", "STUMPED", "HIT_WICKET"]);

const isBowlerCreditedWicket = (ball: ballType): boolean =>
  ball.isWicket &&
  ball.dismissalType !== null &&
  bowlerCreditedDismissals.has(ball.dismissalType);

const getBowlerRunsConceded = (ball: ballType): number =>
  ball.batterRuns + ball.noBallRuns + ball.wideRuns;

const countsAsBallFaced = (ball: ballType): boolean => {
  // Wides never count as balls faced. In the current seed model,
  // isDeadBall represents an immediate Dead-ball event before the
  // striker had an opportunity to play the delivery.
  return !ball.isWide && !ball.isDeadBall;
};

const calculateMaidens = (bowledBalls: readonly ballType[]): number => {
  const ballsByOver = new Map<string, ballType[]>();

  for (const ball of bowledBalls) {
    const key = `${ball.inningId}:${ball.overNo}`;
    const existing = ballsByOver.get(key);

    if (existing) {
      existing.push(ball);
    } else {
      ballsByOver.set(key, [ball]);
    }
  }

  let maidens = 0;

  for (const overBalls of ballsByOver.values()) {
    const legalBalls = overBalls.filter((ball) => ball.isLegalDelivery).length;
    const runsConceded = overBalls.reduce(
      (total, ball) => total + getBowlerRunsConceded(ball),
      0,
    );

    // Byes and Leg-byes are not charged to the bowler, so an over
    // containing only those extras can still be a maiden.
    if (legalBalls === 6 && runsConceded === 0) {
      maidens++;
    }
  }

  return maidens;
};

const calculateConsecutiveWicketMilestones = (
  bowledBalls: readonly ballType[],
): ConsecutiveWicketMilestones => {
  const milestones: ConsecutiveWicketMilestones = {
    twoWicketsInTwoBalls: 0,
    hatTricks: 0,
    fourWicketsInFourBalls: 0,
    fiveWicketsInFiveBalls: 0,
    sixWicketsInSixBalls: 0,
  };

  const ballsByInning = new Map<string, ballType[]>();

  for (const ball of bowledBalls) {
    const existing = ballsByInning.get(ball.inningId);

    if (existing) {
      existing.push(ball);
    } else {
      ballsByInning.set(ball.inningId, [ball]);
    }
  }

  for (const inningBalls of ballsByInning.values()) {
    inningBalls.sort((a, b) => a.deliveryNo - b.deliveryNo);

    let wicketStreak = 0;

    for (const ball of inningBalls) {
      if (isBowlerCreditedWicket(ball)) {
        wicketStreak++;
      } else {
        // Any delivery by this bowler without a credited wicket breaks
        // the sequence, including a Wide, No-ball, dot, scoring shot,
        // Run-out, Obstructing the field, or Hit the ball twice.
        wicketStreak = 0;
      }

      // These are overlapping windows. Four wickets in four balls contain
      // three two-in-two windows and two hat-trick windows.
      if (wicketStreak >= 2) milestones.twoWicketsInTwoBalls++;
      if (wicketStreak >= 3) milestones.hatTricks++;
      if (wicketStreak >= 4) milestones.fourWicketsInFourBalls++;
      if (wicketStreak >= 5) milestones.fiveWicketsInFiveBalls++;
      if (wicketStreak >= 6) milestones.sixWicketsInSixBalls++;
    }
  }

  return milestones;
};

const assertPositiveInteger = (value: number, fieldName: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
};

const assertUniqueIds = <T extends { id: string }>(
  values: readonly T[],
  entityName: string,
): void => {
  const ids = values.map((value) => value.id);

  if (new Set(ids).size !== ids.length) {
    throw new Error(`${entityName} IDs must be unique.`);
  }
};

const getOppositionTeamId = (match: matchType, teamId: string): string => {
  if (teamId === match.homeTeamId) {
    return match.awayTeamId;
  }

  if (teamId === match.awayTeamId) {
    return match.homeTeamId;
  }

  throw new Error(`Team "${teamId}" does not belong to match "${match.id}".`);
};

const getFirstInningsBattingTeamId = (match: matchType): string => {
  if (!match.homeTeamId || !match.awayTeamId) {
    throw new Error(`Match "${match.id}" must contain home and away teams.`);
  }

  if (match.homeTeamId === match.awayTeamId) {
    throw new Error(`Match "${match.id}" cannot use the same team twice.`);
  }

  if (!match.tossWinnerTeamId) {
    throw new Error(`Match "${match.id}" must contain a toss winner.`);
  }

  if (
    match.tossWinnerTeamId !== match.homeTeamId &&
    match.tossWinnerTeamId !== match.awayTeamId
  ) {
    throw new Error(
      `Toss winner for match "${match.id}" must be one of the match teams.`,
    );
  }

  if (!match.tossDecision) {
    throw new Error(`Match "${match.id}" must contain a toss decision.`);
  }

  return match.tossDecision === TossDecision.BAT
    ? match.tossWinnerTeamId
    : getOppositionTeamId(match, match.tossWinnerTeamId);
};

const getSelectedWicketKeeper = (
  playingPlayers: readonly matchPlayerType[],
  playerById: ReadonlyMap<string, (typeof players)[number]>,
  matchId: string,
  teamId: string,
): matchPlayerType => {
  const selectedWicketKeepers = playingPlayers.filter(
    (matchPlayer) => matchPlayer.isWicketKeeper,
  );

  if (selectedWicketKeepers.length !== 1) {
    throw new Error(
      `Team "${teamId}" in match "${matchId}" must have exactly one selected wicketkeeper. Found ${selectedWicketKeepers.length}.`,
    );
  }

  const wicketKeeper = selectedWicketKeepers[0];

  if (!wicketKeeper) {
    throw new Error(
      `Selected wicketkeeper could not be resolved for team "${teamId}" in match "${matchId}".`,
    );
  }

  const player = playerById.get(wicketKeeper.playerId);

  if (!player) {
    throw new Error(
      `Wicketkeeper "${wicketKeeper.id}" references unknown player "${wicketKeeper.playerId}".`,
    );
  }

  if (!player.canKeepWickets) {
    throw new Error(
      `Match-player "${wicketKeeper.id}" is selected as wicketkeeper, but player "${player.id}" cannot keep wickets.`,
    );
  }

  return wicketKeeper;
};

const getPlayingPlayersByLineupOrder = (
  matchPlayers: readonly matchPlayerType[],
  matchId: string,
  teamId: string,
): matchPlayerType[] => {
  const teamPlayers = matchPlayers.filter(
    (matchPlayer) => matchPlayer.teamId === teamId,
  );

  const invalidBenchPlayer = teamPlayers.find(
    (matchPlayer) =>
      !matchPlayer.isPlaying &&
      (matchPlayer.lineupOrder !== null ||
        matchPlayer.battingOrder !== null ||
        matchPlayer.isWicketKeeper),
  );

  if (invalidBenchPlayer) {
    throw new Error(
      `Bench match-player "${invalidBenchPlayer.id}" cannot have lineupOrder, battingOrder, or wicketkeeper assignment.`,
    );
  }

  const playingPlayers = teamPlayers.filter(
    (matchPlayer) => matchPlayer.isPlaying,
  );

  for (const matchPlayer of playingPlayers) {
    if (
      matchPlayer.lineupOrder === null ||
      !Number.isInteger(matchPlayer.lineupOrder) ||
      matchPlayer.lineupOrder <= 0
    ) {
      throw new Error(
        `Playing match-player "${matchPlayer.id}" in match "${matchId}" must have a positive lineup order.`,
      );
    }
  }

  const sortedPlayers = [...playingPlayers].sort(
    (firstPlayer, secondPlayer) =>
      (firstPlayer.lineupOrder ?? Number.MAX_SAFE_INTEGER) -
      (secondPlayer.lineupOrder ?? Number.MAX_SAFE_INTEGER),
  );

  for (const [index, matchPlayer] of sortedPlayers.entries()) {
    const expectedOrder = index + 1;

    if (matchPlayer.lineupOrder !== expectedOrder) {
      throw new Error(
        `Team "${teamId}" in match "${matchId}" must have continuous lineup orders from 1 to ${playingPlayers.length}. Expected ${expectedOrder}, received ${matchPlayer.lineupOrder}.`,
      );
    }
  }

  return sortedPlayers;
};

const buildPlayingPlayerStats = (
  playingPlayer: matchPlayerType,
  currentMatchBalls: readonly ballType[],
  battingOrder: number | null,
): matchPlayerType => {
  const playerAtCreaseBalls = currentMatchBalls.filter(
    (ball) =>
      ball.strikerMatchPlayerId === playingPlayer.id ||
      ball.nonStrikerMatchPlayerId === playingPlayer.id,
  );

  const didBat = playerAtCreaseBalls.length > 0;

  if (didBat && battingOrder === null) {
    throw new Error(
      `Batting order could not be resolved for match-player "${playingPlayer.id}".`,
    );
  }

  const playerOnStrikeBalls = currentMatchBalls.filter(
    (ball) => ball.strikerMatchPlayerId === playingPlayer.id,
  );

  const bowledBalls = currentMatchBalls
    .filter((ball) => ball.bowlerMatchPlayerId === playingPlayer.id)
    .sort((a, b) => {
      if (a.inningId !== b.inningId) {
        return a.inningId.localeCompare(b.inningId);
      }

      return a.deliveryNo - b.deliveryNo;
    });

  const dismissalBall = currentMatchBalls.find(
    (ball) => ball.dismissedMatchPlayerId === playingPlayer.id,
  );

  const runsScored = playerOnStrikeBalls.reduce(
    (total, ball) => total + ball.batterRuns,
    0,
  );

  const ballsFaced = playerOnStrikeBalls.filter(countsAsBallFaced).length;

  const battingDotBalls = playerOnStrikeBalls.filter(
    (ball) => ball.isDotBall,
  ).length;

  const singles = playerOnStrikeBalls.filter(
    (ball) => ball.batterRuns === 1,
  ).length;

  const doubles = playerOnStrikeBalls.filter(
    (ball) => ball.batterRuns === 2,
  ).length;

  const triples = playerOnStrikeBalls.filter(
    (ball) => ball.batterRuns === 3,
  ).length;

  const runningFours = playerOnStrikeBalls.filter(
    (ball) => ball.batterRuns === 4 && !ball.isFour,
  ).length;

  const fours = playerOnStrikeBalls.filter((ball) => ball.isFour).length;
  const sixes = playerOnStrikeBalls.filter((ball) => ball.isSix).length;

  const legalBallsBowled = bowledBalls.filter(
    (ball) => ball.isLegalDelivery,
  ).length;

  const bowlingDotBalls = bowledBalls.filter((ball) => ball.isDotBall).length;

  const singlesConceded = bowledBalls.filter(
    (ball) => ball.batterRuns === 1,
  ).length;

  const doublesConceded = bowledBalls.filter(
    (ball) => ball.batterRuns === 2,
  ).length;

  const triplesConceded = bowledBalls.filter(
    (ball) => ball.batterRuns === 3,
  ).length;

  const runningFoursConceded = bowledBalls.filter(
    (ball) => ball.batterRuns === 4 && !ball.isFour,
  ).length;

  const foursConceded = bowledBalls.filter((ball) => ball.isFour).length;
  const sixesConceded = bowledBalls.filter((ball) => ball.isSix).length;

  const wideDeliveries = bowledBalls.filter((ball) => ball.isWide).length;
  const noBallDeliveries = bowledBalls.filter((ball) => ball.isNoBall).length;

  const runsConceded = bowledBalls.reduce(
    (total, ball) => total + getBowlerRunsConceded(ball),
    0,
  );

  const wickets = bowledBalls.filter(isBowlerCreditedWicket).length;
  const maidens = calculateMaidens(bowledBalls);
  const wicketMilestones = calculateConsecutiveWicketMilestones(bowledBalls);

  const catches = currentMatchBalls.filter(
    (ball) =>
      ball.dismissalType === "CAUGHT" &&
      ball.fielderMatchPlayerId === playingPlayer.id,
  ).length;

  const catchAssists = currentMatchBalls.filter(
    (ball) =>
      ball.dismissalType === "CAUGHT" &&
      ball.assistFielderMatchPlayerId === playingPlayer.id,
  ).length;

  const stumpings = currentMatchBalls.filter(
    (ball) =>
      ball.dismissalType === "STUMPED" &&
      ball.fielderMatchPlayerId === playingPlayer.id,
  ).length;

  const runOuts = currentMatchBalls.filter(
    (ball) =>
      ball.dismissalType === "RUN_OUT" &&
      ball.fielderMatchPlayerId === playingPlayer.id,
  ).length;

  const runOutAssists = currentMatchBalls.filter(
    (ball) =>
      ball.dismissalType === "RUN_OUT" &&
      ball.assistFielderMatchPlayerId === playingPlayer.id,
  ).length;

  return {
    ...playingPlayer,
    didBat,
    battingOrder: didBat ? battingOrder : null,
    runsScored,
    ballsFaced,
    battingDotBalls,
    singles,
    doubles,
    triples,
    runningFours,
    fours,
    sixes,
    isOut: dismissalBall !== undefined,
    dismissalType: dismissalBall?.dismissalType ?? null,
    didBowl: bowledBalls.length > 0,
    legalBallsBowled,
    bowlingDotBalls,
    singlesConceded,
    doublesConceded,
    triplesConceded,
    runningFoursConceded,
    foursConceded,
    sixesConceded,
    wideDeliveries,
    noBallDeliveries,
    runsConceded,
    maidens,
    wickets,
    ...wicketMilestones,
    catches,
    catchAssists,
    stumpings,
    runOuts,
    runOutAssists,
  };
};

const buildBattingOrderByMatchPlayerId = (
  battingMatchPlayers: readonly matchPlayerType[],
  inningBalls: readonly ballType[],
): Map<string, number> => {
  const firstAppearanceDeliveryByPlayerId = new Map<string, number>();

  const sortedBalls = [...inningBalls].sort(
    (firstBall, secondBall) => firstBall.deliveryNo - secondBall.deliveryNo,
  );

  const registerAppearance = (
    matchPlayerId: string,
    deliveryNo: number,
  ): void => {
    if (!firstAppearanceDeliveryByPlayerId.has(matchPlayerId)) {
      firstAppearanceDeliveryByPlayerId.set(matchPlayerId, deliveryNo);
    }
  };

  for (const ball of sortedBalls) {
    registerAppearance(ball.strikerMatchPlayerId, ball.deliveryNo);

    registerAppearance(ball.nonStrikerMatchPlayerId, ball.deliveryNo);
  }

  const appearedPlayers = battingMatchPlayers
    .filter((matchPlayer) =>
      firstAppearanceDeliveryByPlayerId.has(matchPlayer.id),
    )
    .sort((firstPlayer, secondPlayer) => {
      const firstDelivery =
        firstAppearanceDeliveryByPlayerId.get(firstPlayer.id) ??
        Number.MAX_SAFE_INTEGER;

      const secondDelivery =
        firstAppearanceDeliveryByPlayerId.get(secondPlayer.id) ??
        Number.MAX_SAFE_INTEGER;

      if (firstDelivery !== secondDelivery) {
        return firstDelivery - secondDelivery;
      }

      // Both opening batters first appear on delivery 1.
      // Use lineup order to decide positions 1 and 2.
      return (
        (firstPlayer.lineupOrder ?? Number.MAX_SAFE_INTEGER) -
        (secondPlayer.lineupOrder ?? Number.MAX_SAFE_INTEGER)
      );
    });

  return new Map(
    appearedPlayers.map((matchPlayer, index) => [matchPlayer.id, index + 1]),
  );
};

export const getMatchDataForMatch = (
  matches: readonly matchType[],
  matchesPlayers: readonly matchPlayerType[],
  options: MatchGenerationOptions = {},
): GeneratedMatchData => {
  const maxOvers = options.maxOvers ?? 10;
  const maxBowlerOvers =
    options.maxBowlerOvers ?? Math.max(1, Math.ceil(maxOvers / 5));
  const expectedPlayingPlayersPerTeam =
    options.expectedPlayingPlayersPerTeam === undefined
      ? 11
      : options.expectedPlayingPlayersPerTeam;
  const random = options.random ?? Math.random;

  const inningIdStart = options.inningIdStart ?? 401;
  const ballIdStart = options.ballIdStart ?? 501;

  assertPositiveInteger(maxOvers, "maxOvers");
  assertPositiveInteger(maxBowlerOvers, "maxBowlerOvers");
  assertPositiveInteger(inningIdStart, "inningIdStart");
  assertPositiveInteger(ballIdStart, "ballIdStart");

  if (
    expectedPlayingPlayersPerTeam !== null &&
    (!Number.isInteger(expectedPlayingPlayersPerTeam) ||
      expectedPlayingPlayersPerTeam < 2)
  ) {
    throw new Error(
      "expectedPlayingPlayersPerTeam must be null or an integer of at least 2.",
    );
  }

  assertUniqueIds(matches, "Match");
  assertUniqueIds(matchesPlayers, "Match-player");
  assertUniqueIds(players, "Player");

  const matchIdSet = new Set(matches.map((match) => match.id));
  const orphanMatchPlayer = matchesPlayers.find(
    (matchPlayer) => !matchIdSet.has(matchPlayer.matchId),
  );

  if (orphanMatchPlayer) {
    throw new Error(
      `Match-player "${orphanMatchPlayer.id}" references unknown match "${orphanMatchPlayer.matchId}".`,
    );
  }

  const playerById = new Map(players.map((player) => [player.id, player]));

  const matchInningsData: matchInning[] = [];
  const matchPlayersData: matchPlayerType[] = [];
  const ballsData: ballType[] = [];

  let nextMatchInningId = inningIdStart;
  let nextBallId = ballIdStart;

  for (const match of matches) {
    const matchPlayers = matchesPlayers.filter(
      (matchPlayer) => matchPlayer.matchId === match.id,
    );

    const realPlayerIdsInMatch = matchPlayers.map(
      (matchPlayer) => matchPlayer.playerId,
    );

    if (new Set(realPlayerIdsInMatch).size !== realPlayerIdsInMatch.length) {
      throw new Error(
        `A player cannot appear more than once in match "${match.id}".`,
      );
    }

    const invalidTeamPlayer = matchPlayers.find(
      (matchPlayer) =>
        matchPlayer.teamId !== match.homeTeamId &&
        matchPlayer.teamId !== match.awayTeamId,
    );

    if (invalidTeamPlayer) {
      throw new Error(
        `Match-player "${invalidTeamPlayer.id}" belongs to a team outside match "${match.id}".`,
      );
    }

    for (const matchPlayer of matchPlayers) {
      if (!playerById.has(matchPlayer.playerId)) {
        throw new Error(
          `Match-player "${matchPlayer.id}" references unknown player "${matchPlayer.playerId}".`,
        );
      }
    }

    const homeTeamPlayingPlayers = getPlayingPlayersByLineupOrder(
      matchPlayers,
      match.id,
      match.homeTeamId,
    );

    const awayTeamPlayingPlayers = getPlayingPlayersByLineupOrder(
      matchPlayers,
      match.id,
      match.awayTeamId,
    );

    if (expectedPlayingPlayersPerTeam !== null) {
      if (homeTeamPlayingPlayers.length !== expectedPlayingPlayersPerTeam) {
        throw new Error(
          `Home team "${match.homeTeamId}" in match "${match.id}" must have exactly ${expectedPlayingPlayersPerTeam} playing players.`,
        );
      }

      if (awayTeamPlayingPlayers.length !== expectedPlayingPlayersPerTeam) {
        throw new Error(
          `Away team "${match.awayTeamId}" in match "${match.id}" must have exactly ${expectedPlayingPlayersPerTeam} playing players.`,
        );
      }
    } else if (
      homeTeamPlayingPlayers.length < 2 ||
      awayTeamPlayingPlayers.length < 2
    ) {
      throw new Error(
        `Both teams in match "${match.id}" must have at least two playing players.`,
      );
    }

    const homeWicketKeeper = getSelectedWicketKeeper(
      homeTeamPlayingPlayers,
      playerById,
      match.id,
      match.homeTeamId,
    );

    const awayWicketKeeper = getSelectedWicketKeeper(
      awayTeamPlayingPlayers,
      playerById,
      match.id,
      match.awayTeamId,
    );

    const wicketKeeperMatchPlayerIds = new Set([
      homeWicketKeeper.id,
      awayWicketKeeper.id,
    ]);

    if (match.status !== MatchStatus.COMPLETED) {
      for (const matchPlayer of matchPlayers) {
        matchPlayersData.push({
          ...matchPlayer,
          battingOrder: null,
          isWicketKeeper: wicketKeeperMatchPlayerIds.has(matchPlayer.id),
        });
      }

      continue;
    }

    const firstInningsBattingTeamId = getFirstInningsBattingTeamId(match);
    const secondInningsBattingTeamId = getOppositionTeamId(
      match,
      firstInningsBattingTeamId,
    );

    const inningsBattingTeams = [
      firstInningsBattingTeamId,
      secondInningsBattingTeamId,
    ] as const;

    let firstInningsRuns: number | null = null;
    const currentMatchBalls: ballType[] = [];
    const currentMatchBattingOrderByPlayerId = new Map<string, number>();

    for (const [inningIndex, battingTeamId] of inningsBattingTeams.entries()) {
      const fieldingTeamId = getOppositionTeamId(match, battingTeamId);

      const battingMatchPlayers =
        battingTeamId === match.homeTeamId
          ? homeTeamPlayingPlayers
          : awayTeamPlayingPlayers;

      const fieldingMatchPlayers =
        fieldingTeamId === match.homeTeamId
          ? homeTeamPlayingPlayers
          : awayTeamPlayingPlayers;

      const wicketKeeperMatchPlayer =
        fieldingTeamId === match.homeTeamId
          ? homeWicketKeeper
          : awayWicketKeeper;

      const bowlingPlayers: BowlingPlayer[] = fieldingMatchPlayers.flatMap(
        (matchPlayer) => {
          if (matchPlayer.id === wicketKeeperMatchPlayer.id) {
            return [];
          }

          const role = playerById.get(matchPlayer.playerId)?.role;

          if (role !== "BOWLER" && role !== "ALL_ROUNDER") {
            return [];
          }

          return [{ value: matchPlayer.id, role }];
        },
      );

      if (bowlingPlayers.length === 0) {
        throw new Error(
          `No eligible bowlers found for fielding team "${fieldingTeamId}" in match "${match.id}".`,
        );
      }

      if (bowlingPlayers.length * maxBowlerOvers < maxOvers) {
        throw new Error(
          `Fielding team "${fieldingTeamId}" in match "${match.id}" does not have enough bowling capacity for ${maxOvers} overs with a ${maxBowlerOvers}-over limit per bowler.`,
        );
      }

      const target =
        inningIndex === 0
          ? null
          : (() => {
              if (firstInningsRuns === null) {
                throw new Error(
                  `First-innings runs are unavailable for match "${match.id}".`,
                );
              }

              return firstInningsRuns + 1;
            })();

      const inning: matchInning = {
        id: String(nextMatchInningId),
        matchId: match.id,
        teamId: battingTeamId,
        inningsNo:
          inningIndex === 0 ? MatchInningNo.FIRST : MatchInningNo.SECOND,
        runs: 0,
        wickets: 0,
        balls: 0,
        maxOvers,
        status: MatchInningStatus.COMPLETED,
        target,
      };

      const battingPlayerIds = battingMatchPlayers.map(
        (matchPlayer) => matchPlayer.id,
      );

      const fielders = fieldingMatchPlayers.map(
        (matchPlayer) => matchPlayer.id,
      );

      const generatedBalls = generateBalls(
        inning,
        battingPlayerIds,
        bowlingPlayers,
        wicketKeeperMatchPlayer.id,
        fielders,
        maxBowlerOvers,
        nextBallId,
        random,
      );

      const inningBalls = generatedBalls;
      const inningBattingOrders = buildBattingOrderByMatchPlayerId(
        battingMatchPlayers,
        inningBalls,
      );

      for (const [matchPlayerId, battingOrder] of inningBattingOrders) {
        currentMatchBattingOrderByPlayerId.set(matchPlayerId, battingOrder);
      }

      const totalRuns = inningBalls.reduce(
        (total, ball) => total + ball.totalRuns,
        0,
      );

      const totalWickets = inningBalls.filter((ball) => ball.isWicket).length;
      const totalLegalBalls = inningBalls.filter(
        (ball) => ball.isLegalDelivery,
      ).length;

      inning.runs = totalRuns;
      inning.wickets = totalWickets;
      inning.balls = totalLegalBalls;

      if (inningIndex === 0) {
        firstInningsRuns = totalRuns;
      }

      matchInningsData.push(inning);
      currentMatchBalls.push(...inningBalls);
      ballsData.push(...inningBalls);

      nextMatchInningId++;
      nextBallId += inningBalls.length;
    }

    for (const matchPlayer of matchPlayers) {
      const battingOrder =
        currentMatchBattingOrderByPlayerId.get(matchPlayer.id) ?? null;

      const isWicketKeeper = wicketKeeperMatchPlayerIds.has(matchPlayer.id);

      matchPlayersData.push(
        matchPlayer.isPlaying
          ? {
              ...buildPlayingPlayerStats(
                matchPlayer,
                currentMatchBalls,
                battingOrder,
              ),
              isWicketKeeper,
            }
          : {
              ...matchPlayer,
              battingOrder: null,
              isWicketKeeper: false,
            },
      );
    }
  }

  return {
    matchInningsData,
    matchPlayersData,
    ballsData,
  };
};
