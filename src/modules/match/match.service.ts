import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

import {
  matchCommentaryBySlugSelect,
  matchDetailsBySlugSelect,
  matchListSelect,
  matchPlayersBySlugSelect,
  matchScoreBySlugSelect,
  type CompletedMatchResult,
  type MatchBowlerIntro,
  type MatchCommentaryBySlugQueryResult,
  type MatchCommentaryInningQueryResult,
  type MatchCommentaryResponse,
  type MatchDetailsBySlug,
  type MatchDetailsBySlugQueryResult,
  type MatchInningCommentary,
  type MatchInningSummary,
  type MatchListItem,
  type MatchListQueryResult,
  type MatchPlayerItem,
  type MatchPlayerQueryResult,
  type MatchPlayersBySlugQueryResult,
  type MatchPlayersResponse,
  type MatchPlayersTeam,
  type MatchScoreBallQueryResult,
  type MatchScoreBatter,
  type MatchScoreBowler,
  type MatchScoreBySlugQueryResult,
  type MatchScoreExtras,
  type MatchScoreFallOfWicket,
  type MatchScoreInning,
  type MatchScoreInningQueryResult,
  type MatchScorePartnership,
  type MatchScorePartnershipBatter,
  type MatchScorePlayer,
  type MatchScorePlayerQueryResult,
  type MatchScoreResponse,
  type MatchTeamDetails,
  type MatchTeamQueryResult,
  type MatchTeamSummary,
} from "./match.types.js";

type BowlerIntroWithPlayerId = MatchBowlerIntro & {
  playerId: string;
};

const roundToTwoDecimals = (value: number): number => {
  return Number(value.toFixed(2));
};

const calculateEconomyRate = (
  runsConceded: number,
  legalBallsBowled: number,
): number => {
  if (legalBallsBowled === 0) {
    return 0;
  }

  return roundToTwoDecimals((runsConceded * 6) / legalBallsBowled);
};

const formatMatchCommentaryInning = (
  inning: MatchCommentaryInningQueryResult,
  bowlerStatsMap: Map<
    string,
    {
      match: number;
      wicket: number;
      average: number;
      economy: number;
      best: string;
    }
  >,
): MatchInningCommentary => {
  const bowlerMap = new Map<string, BowlerIntroWithPlayerId>();

  // ballsData is sorted by deliveryNo descending (latest first).
  // Iterate in ascending order (chronological order) so we catch the bowler's first deliveryNo in the inning.
  const chronologicalBalls = [...inning.ballsData].sort(
    (a, b) => a.deliveryNo - b.deliveryNo,
  );

  for (const ball of chronologicalBalls) {
    const bowlerMatchPlayer = ball.bowlerMatchPlayer;
    const bowler = bowlerMatchPlayer.player;
    if (!bowlerMap.has(bowler.slug)) {
      const stats = bowlerStatsMap.get(bowlerMatchPlayer.playerId);
      bowlerMap.set(bowler.slug, {
        playerName: bowler.playerName,
        slug: bowler.slug,
        photoUrl: bowler.photoUrl,
        deliveryNo: ball.deliveryNo,
        match: stats?.match ?? 0,
        wicket: stats?.wicket ?? 0,
        average: stats?.average ?? 0,
        economy: stats?.economy ?? 0,
        best: stats?.best ?? "0/0",
        playerId: bowlerMatchPlayer.playerId,
      });
    }
  }

  return {
    bowlerIntro: Array.from(bowlerMap.values()).map(
      ({ playerId: _playerId, ...bowlerIntro }) => bowlerIntro,
    ),
    commentary: inning.ballsData.map((ball) => {
      return {
        deliveryNo: ball.deliveryNo,
        overNo: ball.overNo,
        ballNo: ball.ballNo,
        commentaryText: ball.commentaryText,
      };
    }),
  };
};

const formatMatchCommentaryResponse = async (
  match: MatchCommentaryBySlugQueryResult,
): Promise<MatchCommentaryResponse> => {
  const firstInning = match.innings.find(
    (inning) => inning.inningsNo === "FIRST",
  );

  const secondInning = match.innings.find(
    (inning) => inning.inningsNo === "SECOND",
  );

  // Extract unique player IDs of all bowlers across both innings
  const playerIdsSet = new Set<string>();
  for (const inning of match.innings) {
    for (const ball of inning.ballsData) {
      playerIdsSet.add(ball.bowlerMatchPlayer.playerId);
    }
  }
  const playerIds = Array.from(playerIdsSet);

  const bowlerStatsMap = new Map<
    string,
    {
      match: number;
      wicket: number;
      average: number;
      economy: number;
      best: string;
    }
  >();

  if (playerIds.length > 0) {
    const statsList = await Promise.all(
      playerIds.map(async (playerId) => {
        const whereClause: Prisma.MatchPlayerWhereInput = {
          playerId,
          isPlaying: true,
          match: {
            matchFormat: match.matchFormat,
            matchDate: {
              lt: match.matchDate,
            },
          },
        };

        const count = await prisma.matchPlayer.count({
          where: whereClause,
        });

        const aggregateResult = await prisma.matchPlayer.aggregate({
          where: whereClause,
          _sum: {
            wickets: true,
            runsConceded: true,
            legalBallsBowled: true,
          },
        });

        const bestPerformance = await prisma.matchPlayer.findFirst({
          where: {
            ...whereClause,
            didBowl: true,
          },
          orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
          select: {
            wickets: true,
            runsConceded: true,
          },
        });

        const totalWickets = aggregateResult._sum.wickets ?? 0;
        const totalRunsConceded = aggregateResult._sum.runsConceded ?? 0;
        const totalLegalBallsBowled =
          aggregateResult._sum.legalBallsBowled ?? 0;

        const average =
          totalWickets > 0
            ? roundToTwoDecimals(totalRunsConceded / totalWickets)
            : 0;

        const economy = calculateEconomyRate(
          totalRunsConceded,
          totalLegalBallsBowled,
        );

        const best = bestPerformance
          ? `${bestPerformance.wickets}/${bestPerformance.runsConceded}`
          : "0/0";

        return {
          playerId,
          count,
          wicket: totalWickets,
          average,
          economy,
          best,
        };
      }),
    );

    for (const {
      playerId,
      count,
      wicket,
      average,
      economy,
      best,
    } of statsList) {
      bowlerStatsMap.set(playerId, {
        match: count,
        wicket,
        average,
        economy,
        best,
      });
    }
  }

  return {
    firstInning: firstInning
      ? formatMatchCommentaryInning(firstInning, bowlerStatsMap)
      : null,

    secondInning: secondInning
      ? formatMatchCommentaryInning(secondInning, bowlerStatsMap)
      : null,
  };
};

const formatOvers = (legalBalls: number): number => {
  const completedOvers = Math.floor(legalBalls / 6);
  const remainingBalls = legalBalls % 6;

  return Number(`${completedOvers}.${remainingBalls}`);
};

const formatBallPosition = (overNo: number, ballNo: number): number => {
  return Number(`${overNo}.${ballNo}`);
};

const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) {
    return 0;
  }

  return roundToTwoDecimals((runs / balls) * 100);
};

const formatScorePlayer = (
  matchPlayer: MatchScorePlayerQueryResult,
): MatchScorePlayer => {
  return {
    playerName: matchPlayer.player.playerName,
    slug: matchPlayer.player.slug,
  };
};

const compareNullableOrderAscending = (
  firstOrder: number | null,
  secondOrder: number | null,
): number => {
  if (firstOrder === null && secondOrder === null) {
    return 0;
  }

  if (firstOrder === null) {
    return 1;
  }

  if (secondOrder === null) {
    return -1;
  }

  return firstOrder - secondOrder;
};

const compareNullableOrderDescending = (
  firstOrder: number | null,
  secondOrder: number | null,
): number => {
  if (firstOrder === null && secondOrder === null) {
    return 0;
  }

  if (firstOrder === null) {
    return 1;
  }

  if (secondOrder === null) {
    return -1;
  }

  return secondOrder - firstOrder;
};

const comparePlayerNames = (
  firstPlayer: MatchScorePlayerQueryResult,
  secondPlayer: MatchScorePlayerQueryResult,
): number => {
  return firstPlayer.player.playerName.localeCompare(
    secondPlayer.player.playerName,
  );
};

const formatDismissalText = (
  matchPlayer: MatchScorePlayerQueryResult,
  balls: MatchScoreBallQueryResult[],
): string => {
  if (!matchPlayer.isOut) {
    return "";
  }

  const dismissalBall = balls.find(
    (ball) => ball.isWicket && ball.dismissedMatchPlayerId === matchPlayer.id,
  );

  const dismissalType =
    dismissalBall?.dismissalType ?? matchPlayer.dismissalType;

  if (!dismissalType) {
    return "";
  }

  const bowlerName = dismissalBall?.bowlerMatchPlayer.player.playerName ?? "";

  const fielderName =
    dismissalBall?.fielderMatchPlayer?.player.playerName ?? "";

  const assistFielderName =
    dismissalBall?.assistFielderMatchPlayer?.player.playerName ?? "";

  switch (dismissalType) {
    case "BOWLED":
      return bowlerName ? `b ${bowlerName}` : "bowled";

    case "CAUGHT": {
      const isCaughtAndBowled =
        dismissalBall?.fielderMatchPlayerId ===
        dismissalBall?.bowlerMatchPlayerId;

      if (isCaughtAndBowled && bowlerName) {
        return `c & b ${bowlerName}`;
      }

      if (fielderName && bowlerName) {
        return `c ${fielderName} b ${bowlerName}`;
      }

      return "caught";
    }

    case "LBW":
      return bowlerName ? `lbw b ${bowlerName}` : "lbw";

    case "RUN_OUT": {
      const fielders = [fielderName, assistFielderName].filter(
        (name) => name.length > 0,
      );

      return fielders.length > 0
        ? `run out (${fielders.join("/")})`
        : "run out";
    }

    case "STUMPED":
      if (fielderName && bowlerName) {
        return `st ${fielderName} b ${bowlerName}`;
      }

      return "stumped";

    case "HIT_WICKET":
      return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";

    case "HIT_BALL_TWICE":
      return "hit ball twice";

    case "OBSTRUCTING_FIELD":
      return "obstructing the field";

    case "TIMED_OUT":
      return "timed out";

    case "RETIRED_OUT":
      return "retired out";
  }
};

const formatScoreBatters = (
  battingPlayers: MatchScorePlayerQueryResult[],
  balls: MatchScoreBallQueryResult[],
): MatchScoreBatter[] => {
  return battingPlayers
    .filter((matchPlayer) => matchPlayer.didBat)
    .sort((firstPlayer, secondPlayer) => {
      const firstOrder = firstPlayer.battingOrder ?? firstPlayer.lineupOrder;

      const secondOrder = secondPlayer.battingOrder ?? secondPlayer.lineupOrder;

      const orderDifference = compareNullableOrderAscending(
        firstOrder,
        secondOrder,
      );

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return comparePlayerNames(firstPlayer, secondPlayer);
    })
    .map((matchPlayer) => {
      return {
        ...formatScorePlayer(matchPlayer),
        runs: matchPlayer.runsScored,
        balls: matchPlayer.ballsFaced,
        fours: matchPlayer.fours,
        sixes: matchPlayer.sixes,
        strikeRate: calculateStrikeRate(
          matchPlayer.runsScored,
          matchPlayer.ballsFaced,
        ),
        isOut: matchPlayer.isOut,
        dismissalText: formatDismissalText(matchPlayer, balls),
      };
    });
};

const formatNotBatPlayers = (
  battingPlayers: MatchScorePlayerQueryResult[],
): MatchScorePlayer[] => {
  return battingPlayers
    .filter((matchPlayer) => matchPlayer.isPlaying && !matchPlayer.didBat)
    .sort((firstPlayer, secondPlayer) => {
      const orderDifference = compareNullableOrderAscending(
        firstPlayer.lineupOrder,
        secondPlayer.lineupOrder,
      );

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return comparePlayerNames(firstPlayer, secondPlayer);
    })
    .map(formatScorePlayer);
};

const formatScoreBowlers = (
  bowlingPlayers: MatchScorePlayerQueryResult[],
): MatchScoreBowler[] => {
  return bowlingPlayers
    .filter((matchPlayer) => matchPlayer.didBowl)
    .sort((firstPlayer, secondPlayer) => {
      const orderDifference = compareNullableOrderDescending(
        firstPlayer.lineupOrder,
        secondPlayer.lineupOrder,
      );

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return comparePlayerNames(firstPlayer, secondPlayer);
    })
    .map((matchPlayer) => {
      return {
        ...formatScorePlayer(matchPlayer),
        overs: formatOvers(matchPlayer.legalBallsBowled),
        maidens: matchPlayer.maidens,
        runs: matchPlayer.runsConceded,
        wickets: matchPlayer.wickets,
        economyRate: calculateEconomyRate(
          matchPlayer.runsConceded,
          matchPlayer.legalBallsBowled,
        ),
      };
    });
};

const calculateScoreExtras = (
  balls: MatchScoreBallQueryResult[],
): MatchScoreExtras => {
  const extras = balls.reduce<MatchScoreExtras>(
    (total, ball) => {
      total.byes += ball.byeRuns;
      total.legByes += ball.legByeRuns;
      total.wides += ball.wideRuns;
      total.noBalls += ball.noBallRuns;
      total.penalties += ball.penaltyRuns;

      return total;
    },
    {
      byes: 0,
      legByes: 0,
      wides: 0,
      noBalls: 0,
      penalties: 0,
      total: 0,
    },
  );

  extras.total =
    extras.byes +
    extras.legByes +
    extras.wides +
    extras.noBalls +
    extras.penalties;

  return extras;
};

const buildFallOfWickets = (
  balls: MatchScoreBallQueryResult[],
  playerMap: Map<string, MatchScorePlayerQueryResult>,
): MatchScoreFallOfWicket[] => {
  const fallOfWickets: MatchScoreFallOfWicket[] = [];

  let teamRuns = 0;
  let wicketNo = 0;

  for (const ball of balls) {
    teamRuns += ball.totalRuns;

    if (!ball.isWicket) {
      continue;
    }

    wicketNo += 1;

    if (!ball.dismissedMatchPlayerId) {
      continue;
    }

    const dismissedPlayer = playerMap.get(ball.dismissedMatchPlayerId);

    if (!dismissedPlayer) {
      continue;
    }

    fallOfWickets.push({
      ...formatScorePlayer(dismissedPlayer),
      overs: formatBallPosition(ball.overNo, ball.ballNo),
      runs: teamRuns,
      wicketNo,
    });
  }

  return fallOfWickets;
};

type PartnershipPlayerAccumulator = {
  runs: number;
  balls: number;
};

type PartnershipAccumulator = {
  forWicket: number;
  runs: number;
  balls: number;
  players: Map<string, PartnershipPlayerAccumulator>;
};

const createPartnershipAccumulator = (
  forWicket: number,
): PartnershipAccumulator => {
  return {
    forWicket,
    runs: 0,
    balls: 0,
    players: new Map<string, PartnershipPlayerAccumulator>(),
  };
};

const addPartnershipPlayer = (
  partnership: PartnershipAccumulator,
  matchPlayerId: string,
): void => {
  if (!partnership.players.has(matchPlayerId)) {
    partnership.players.set(matchPlayerId, {
      runs: 0,
      balls: 0,
    });
  }
};

const formatPartnershipBatter = (
  matchPlayer: MatchScorePlayerQueryResult,
  contribution: PartnershipPlayerAccumulator,
): MatchScorePartnershipBatter => {
  return {
    ...formatScorePlayer(matchPlayer),
    runs: contribution.runs,
    balls: contribution.balls,
  };
};

const formatPartnership = (
  partnership: PartnershipAccumulator,
  playerMap: Map<string, MatchScorePlayerQueryResult>,
): MatchScorePartnership | null => {
  const participantEntries = [...partnership.players.entries()].filter(
    ([matchPlayerId]) => playerMap.has(matchPlayerId),
  );

  if (participantEntries.length < 2) {
    return null;
  }

  const firstEntry = participantEntries[0];
  const secondEntry = participantEntries[1];

  if (!firstEntry || !secondEntry) {
    return null;
  }

  const [firstMatchPlayerId, firstContribution] = firstEntry;
  const [secondMatchPlayerId, secondContribution] = secondEntry;

  const firstMatchPlayer = playerMap.get(firstMatchPlayerId);
  const secondMatchPlayer = playerMap.get(secondMatchPlayerId);

  if (!firstMatchPlayer || !secondMatchPlayer) {
    return null;
  }

  return {
    forWicket: partnership.forWicket,
    runs: partnership.runs,
    balls: partnership.balls,

    firstBatter: formatPartnershipBatter(firstMatchPlayer, firstContribution),

    secondBatter: formatPartnershipBatter(
      secondMatchPlayer,
      secondContribution,
    ),
  };
};

const buildPartnerships = (
  balls: MatchScoreBallQueryResult[],
  playerMap: Map<string, MatchScorePlayerQueryResult>,
): MatchScorePartnership[] => {
  const partnerships: MatchScorePartnership[] = [];

  let currentPartnership = createPartnershipAccumulator(1);

  const completeCurrentPartnership = (): void => {
    const partnership = formatPartnership(currentPartnership, playerMap);

    if (partnership) {
      partnerships.push(partnership);
    }
  };

  for (const ball of balls) {
    addPartnershipPlayer(currentPartnership, ball.strikerMatchPlayerId);

    addPartnershipPlayer(currentPartnership, ball.nonStrikerMatchPlayerId);

    currentPartnership.runs += ball.totalRuns;

    const strikerContribution = currentPartnership.players.get(
      ball.strikerMatchPlayerId,
    );

    if (strikerContribution) {
      strikerContribution.runs += ball.batterRuns;

      const countsAsBallFaced = !ball.isWide && !ball.isDeadBall;

      if (countsAsBallFaced) {
        strikerContribution.balls += 1;
        currentPartnership.balls += 1;
      }
    }

    if (ball.isWicket) {
      completeCurrentPartnership();

      currentPartnership = createPartnershipAccumulator(
        currentPartnership.forWicket + 1,
      );
    }
  }

  if (currentPartnership.runs > 0 || currentPartnership.balls > 0) {
    completeCurrentPartnership();
  }

  return partnerships;
};

const formatMatchScoreInning = (
  inning: MatchScoreInningQueryResult,
  matchPlayers: MatchScorePlayerQueryResult[],
): MatchScoreInning => {
  const battingPlayers = matchPlayers.filter(
    (matchPlayer) => matchPlayer.teamId === inning.teamId,
  );

  const bowlingPlayers = matchPlayers.filter(
    (matchPlayer) => matchPlayer.teamId !== inning.teamId,
  );

  const playerMap = new Map(
    matchPlayers.map((matchPlayer) => [matchPlayer.id, matchPlayer]),
  );

  return {
    teamName: inning.team.teamName,
    shortName: generateTeamShortName(inning.team.teamName),
    slug: inning.team.slug,
    logoUrl: inning.team.logoUrl,

    runs: inning.runs,
    overs: formatOvers(inning.balls),
    wickets: inning.wickets,

    score: {
      batters: formatScoreBatters(battingPlayers, inning.ballsData),

      extras: calculateScoreExtras(inning.ballsData),

      notBat: formatNotBatPlayers(battingPlayers),

      bowlers: formatScoreBowlers(bowlingPlayers),

      fallOfWickets: buildFallOfWickets(inning.ballsData, playerMap),

      partnerships: buildPartnerships(inning.ballsData, playerMap),
    },
  };
};

const formatMatchScoreResponse = (
  match: MatchScoreBySlugQueryResult,
): MatchScoreResponse => {
  const firstInning = match.innings.find(
    (inning) => inning.inningsNo === "FIRST",
  );

  const secondInning = match.innings.find(
    (inning) => inning.inningsNo === "SECOND",
  );

  return {
    firstInning: firstInning
      ? formatMatchScoreInning(firstInning, match.players)
      : null,

    secondInning: secondInning
      ? formatMatchScoreInning(secondInning, match.players)
      : null,
  };
};

const normalizeSlug = (slug: string): string => {
  return slug.trim();
};

const generateTeamShortName = (teamName: string): string => {
  const normalizedTeamName = teamName.trim();

  if (normalizedTeamName.length === 0) {
    return "";
  }

  const words = normalizedTeamName.split(/\s+/);

  if (words.length === 1) {
    return normalizedTeamName.slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const formatMatchTeamDetails = (
  team: MatchTeamQueryResult,
): MatchTeamDetails => {
  return {
    id: team.id,
    teamName: team.teamName,
    shortName: generateTeamShortName(team.teamName),
    slug: team.slug,
    logoUrl: team.logoUrl,
  };
};

const formatMatchTeamSummary = (
  team: MatchTeamQueryResult,
  inning: MatchInningSummary | undefined,
): MatchTeamSummary => {
  return {
    ...formatMatchTeamDetails(team),
    inningsNo: inning?.inningsNo ?? null,
    runs: inning?.runs ?? 0,
    wickets: inning?.wickets ?? 0,
    balls: inning?.balls ?? 0,
  };
};

const MAX_WICKETS_PER_INNINGS = 10;

const pluralize = (
  amount: number,
  singular: string,
  plural: string,
): string => {
  return amount === 1 ? singular : plural;
};

const getInningsTeams = (
  homeTeam: MatchTeamSummary,
  awayTeam: MatchTeamSummary,
): {
  firstInningsTeam: MatchTeamSummary;
  secondInningsTeam: MatchTeamSummary;
} | null => {
  if (homeTeam.inningsNo === "FIRST" && awayTeam.inningsNo === "SECOND") {
    return {
      firstInningsTeam: homeTeam,
      secondInningsTeam: awayTeam,
    };
  }

  if (awayTeam.inningsNo === "FIRST" && homeTeam.inningsNo === "SECOND") {
    return {
      firstInningsTeam: awayTeam,
      secondInningsTeam: homeTeam,
    };
  }

  return null;
};

const generateCompletedMatchResult = (
  status: MatchListQueryResult["status"],
  homeTeam: MatchTeamSummary,
  awayTeam: MatchTeamSummary,
): CompletedMatchResult | null => {
  if (status !== "COMPLETED") {
    return null;
  }

  const inningsTeams = getInningsTeams(homeTeam, awayTeam);

  if (!inningsTeams) {
    return null;
  }

  const { firstInningsTeam, secondInningsTeam } = inningsTeams;

  if (firstInningsTeam.runs === secondInningsTeam.runs) {
    return {
      type: "TIED",
      winnerTeamId: null,
      margin: null,
      text: "Match tied",
    };
  }

  if (secondInningsTeam.runs > firstInningsTeam.runs) {
    const wicketsRemaining =
      MAX_WICKETS_PER_INNINGS - secondInningsTeam.wickets;

    if (wicketsRemaining <= 0) {
      return null;
    }

    return {
      type: "WICKETS",
      winnerTeamId: secondInningsTeam.id,
      margin: wicketsRemaining,
      text: `${secondInningsTeam.teamName} won by ${wicketsRemaining} ${pluralize(
        wicketsRemaining,
        "wicket",
        "wickets",
      )}`,
    };
  }

  const winningMargin = firstInningsTeam.runs - secondInningsTeam.runs;

  return {
    type: "RUNS",
    winnerTeamId: firstInningsTeam.id,
    margin: winningMargin,
    text: `${firstInningsTeam.teamName} won by ${winningMargin} ${pluralize(
      winningMargin,
      "run",
      "runs",
    )}`,
  };
};

const formatMatchListItem = (match: MatchListQueryResult): MatchListItem => {
  const homeTeamInning = match.innings.find(
    (inning) => inning.teamId === match.homeTeamId,
  );

  const awayTeamInning = match.innings.find(
    (inning) => inning.teamId === match.awayTeamId,
  );

  const homeTeam = formatMatchTeamSummary(match.homeTeam, homeTeamInning);

  const awayTeam = formatMatchTeamSummary(match.awayTeam, awayTeamInning);

  return {
    id: match.id,
    title: match.title,
    slug: match.slug,
    matchFormat: match.matchFormat,
    status: match.status,
    matchDate: match.matchDate,
    tossWinnerTeamId: match.tossWinnerTeamId,
    tossDecision: match.tossDecision,

    homeTeam,
    awayTeam,

    result: generateCompletedMatchResult(match.status, homeTeam, awayTeam),
  };
};

const formatMatchDetails = (
  match: MatchDetailsBySlugQueryResult,
): MatchDetailsBySlug => {
  return {
    id: match.id,
    title: match.title,
    slug: match.slug,
    matchFormat: match.matchFormat,
    status: match.status,
    matchDate: match.matchDate,
    venue: match.venue,
    city: match.city,
    tossWinnerTeamId: match.tossWinnerTeamId,
    tossDecision: match.tossDecision,

    homeTeam: formatMatchTeamDetails(match.homeTeam),
    awayTeam: formatMatchTeamDetails(match.awayTeam),
  };
};

const resolvePlayerDisplayName = (
  playerName: string,
  displayName: string | null,
): string => {
  const normalizedDisplayName = displayName?.trim();

  return normalizedDisplayName || playerName;
};

const formatMatchPlayer = (
  matchPlayer: MatchPlayerQueryResult,
): MatchPlayerItem => {
  const { player } = matchPlayer;

  return {
    id: player.id,
    playerName: player.playerName,
    displayName: resolvePlayerDisplayName(
      player.playerName,
      player.displayName,
    ),
    slug: player.slug,
    role: player.role,
    photoUrl: player.photoUrl,

    isCaptain: matchPlayer.isCaptain,
    isViceCaptain: matchPlayer.isViceCaptain,
    isWicketKeeper: matchPlayer.isWicketKeeper,
    lineupOrder: matchPlayer.lineupOrder,
  };
};

const formatMatchPlayersTeam = (
  team: MatchTeamQueryResult,
  matchPlayers: MatchPlayerQueryResult[],
): MatchPlayersTeam => {
  const teamMatchPlayers = matchPlayers.filter(
    (matchPlayer) => matchPlayer.teamId === team.id,
  );

  const players: MatchPlayerItem[] = [];
  const benchPlayers: MatchPlayerItem[] = [];

  for (const matchPlayer of teamMatchPlayers) {
    const formattedPlayer = formatMatchPlayer(matchPlayer);

    if (matchPlayer.isPlaying) {
      players.push(formattedPlayer);
    } else {
      benchPlayers.push(formattedPlayer);
    }
  }

  return {
    ...formatMatchTeamDetails(team),
    players,
    benchPlayers,
  };
};

const formatMatchPlayersResponse = (
  match: MatchPlayersBySlugQueryResult,
): MatchPlayersResponse => {
  return {
    homeTeam: formatMatchPlayersTeam(match.homeTeam, match.players),

    awayTeam: formatMatchPlayersTeam(match.awayTeam, match.players),
  };
};

export const getAllMatches = async (): Promise<MatchListItem[]> => {
  const matches = await prisma.match.findMany({
    select: matchListSelect,

    orderBy: {
      matchDate: "desc",
    },
  });

  return matches.map(formatMatchListItem);
};

const findMatchBySlug = <T extends Prisma.MatchSelect>(
  slug: string,
  select: T,
): Prisma.PrismaPromise<Prisma.MatchGetPayload<{ select: T }> | null> => {
  return prisma.match.findUnique({
    where: {
      slug: normalizeSlug(slug),
    },
    select,
  });
};

export const getMatchBySlug = async (
  slug: string,
): Promise<MatchDetailsBySlug | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await findMatchBySlug(slug, matchDetailsBySlugSelect);

  return match ? formatMatchDetails(match) : null;
};

export const getMatchPlayersBySlug = async (
  slug: string,
): Promise<MatchPlayersResponse | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await findMatchBySlug(slug, matchPlayersBySlugSelect);

  return match ? formatMatchPlayersResponse(match) : null;
};

export const getMatchScoreBySlug = async (
  slug: string,
): Promise<MatchScoreResponse | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await findMatchBySlug(normalizedSlug, matchScoreBySlugSelect);

  return match ? formatMatchScoreResponse(match) : null;
};

export const getMatchCommentaryBySlug = async (
  slug: string,
): Promise<MatchCommentaryResponse | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await findMatchBySlug(
    normalizedSlug,
    matchCommentaryBySlugSelect,
  );

  return match ? await formatMatchCommentaryResponse(match) : null;
};
