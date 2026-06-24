import type { PlayerRole, Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";

// ─── Match List ──────────────────────────────────────────────────────────────

const matchListSelect = {
  id: true,
  title: true,
  matchFormat: true,
  status: true,
  matchDate: true,
  matchTextResult: true,
  resultType: true,
  tossDecision: true,
  firstIningRuns: true,
  firstIningWickets: true,
  firstIningOvers: true,
  secondIningRuns: true,
  secondIningWickets: true,
  secondIningOvers: true,
  createdAt: true,
  updatedAt: true,
  homeTeam: {
    select: {
      id: true,
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
  awayTeam: {
    select: {
      id: true,
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
  tossWinnerTeam: {
    select: {
      id: true,
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
  winnerTeam: {
    select: {
      id: true,
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
} as const satisfies Prisma.MatchSelect;

export type MatchListItem = Prisma.MatchGetPayload<{
  select: typeof matchListSelect;
}>;

export const getAllMatches = async (): Promise<MatchListItem[]> => {
  return prisma.match.findMany({
    select: matchListSelect,
    orderBy: { matchDate: "desc" },
  });
};

// ─── Match Details ───────────────────────────────────────────────────────────

const matchDetailInclude = {
  homeTeam: true,
  awayTeam: true,
  tossWinnerTeam: true,
  winnerTeam: true,
} as const satisfies Prisma.MatchInclude;

export type MatchDetails = Prisma.MatchGetPayload<{
  include: typeof matchDetailInclude;
}>;

export const getMatchById = async (id: string): Promise<MatchDetails> => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: matchDetailInclude,
  });

  if (!match) {
    throw ApiError.notFound(`Match with ID ${id} not found`);
  }

  return match;
};

// ─── Match Players ───────────────────────────────────────────────────────────

interface PlayerInfo {
  id: string;
  playerName: string;
  role: PlayerRole;
  photoUrl: string | null;
  displayName: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
}

interface TeamPlayers {
  playingPlayers: PlayerInfo[];
  benchPlayers: PlayerInfo[];
}

interface TeamInfo {
  id: string;
  teamName: string;
  shortName: string | null;
  logoUrl: string | null;
  players: TeamPlayers;
}

export interface MatchPlayersResponse {
  teams: {
    homeTeam: TeamInfo;
    awayTeam: TeamInfo;
  };
}

const matchPlayersSelect = {
  homeTeamId: true,
  awayTeamId: true,
  homeTeam: {
    select: {
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
  awayTeam: {
    select: {
      teamName: true,
      shortName: true,
      logoUrl: true,
    },
  },
  matchPlayers: {
    select: {
      teamId: true,
      isPlayingEleven: true,
      order: true,
      isCaptain: true,
      isViceCaptain: true,
      isWicketKeeper: true,
      player: {
        select: {
          id: true,
          playerName: true,
          role: true,
          photoUrl: true,
          displayName: true,
        },
      },
    },
    orderBy: { order: "asc" as const },
  },
} as const satisfies Prisma.MatchSelect;

type MatchWithPlayers = Prisma.MatchGetPayload<{
  select: typeof matchPlayersSelect;
}>;

type MatchPlayerEntry = MatchWithPlayers["matchPlayers"][number];

const mapPlayerInfo = (mp: MatchPlayerEntry): PlayerInfo => ({
  id: mp.player.id,
  playerName: mp.player.playerName,
  role: mp.player.role,
  photoUrl: mp.player.photoUrl,
  displayName: mp.player.displayName,
  isCaptain: mp.isCaptain,
  isViceCaptain: mp.isViceCaptain,
  isWicketKeeper: mp.isWicketKeeper,
});

const buildTeamPlayers = (
  matchPlayers: MatchWithPlayers["matchPlayers"],
  teamId: string,
): TeamPlayers => {
  const teamEntries = matchPlayers.filter((mp) => mp.teamId === teamId);

  return {
    playingPlayers: teamEntries
      .filter((mp) => mp.isPlayingEleven)
      .map(mapPlayerInfo),
    benchPlayers: teamEntries
      .filter((mp) => !mp.isPlayingEleven)
      .map(mapPlayerInfo),
  };
};

export const getPlayersByMatchId = async (
  id: string,
): Promise<MatchPlayersResponse> => {
  const match = await prisma.match.findUnique({
    where: { id },
    select: matchPlayersSelect,
  });

  if (!match) {
    throw ApiError.notFound(`Match with ID ${id} not found`);
  }

  return {
    teams: {
      homeTeam: {
        id: match.homeTeamId,
        teamName: match.homeTeam.teamName,
        shortName: match.homeTeam.shortName,
        logoUrl: match.homeTeam.logoUrl,
        players: buildTeamPlayers(match.matchPlayers, match.homeTeamId),
      },
      awayTeam: {
        id: match.awayTeamId,
        teamName: match.awayTeam.teamName,
        shortName: match.awayTeam.shortName,
        logoUrl: match.awayTeam.logoUrl,
        players: buildTeamPlayers(match.matchPlayers, match.awayTeamId),
      },
    },
  };
};

// ─── Match Score ───────────────────────────────────────────────────────────

export interface PlayerBattingPerformance {
  id: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikerRate: number;
  isOut: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
  dismissalInfo?: string | null;
}

export interface PlayerBowlingPerformance {
  id: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
}

export interface ExtraRuns {
  wideRuns: number;
  noBallRuns: number;
  byeRuns: number;
  legByeRuns: number;
  penaltyRuns: number;
}

export interface Score {
  run: number;
  wicket: number;
  overs: number;
}

export interface FallOfWicket {
  playerName: string;
  score: Score;
}

export interface Partnership {
  runs: number;
  balls: number;
  wicket: number;
  player1Name: string;
  player1Runs: number;
  player1Balls: number;
  player2Name: string;
  player2Runs: number;
  player2Balls: number;
}

export interface TeamScoreDetail {
  id: string;
  teamName: string;
  shortName: string | null;
  logoUrl: string | null;
  score: Score;
  playerBattingPerformance: PlayerBattingPerformance[];
  playerBowlingPerformance: PlayerBowlingPerformance[];
  nextbatters: string[];
  extraRuns: ExtraRuns;
  fallOfWicket: FallOfWicket[];
  partnership: Partnership[];
}

export interface MatchScore {
  firstInning: TeamScoreDetail;
  secondInning: TeamScoreDetail;
}

export const getScoreByMatchId = async (id: string): Promise<MatchScore> => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      matchPlayers: {
        include: {
          player: true,
        },
      },
      balls: true,
    },
  });

  if (!match) {
    throw ApiError.notFound(`Match with ID ${id} not found`);
  }

  // Home Team is batting in innings 1, away team in innings 2
  const firstIningBalls = match.balls.filter((b) => b.inningsNo === 1);
  const secondIningBalls = match.balls.filter((b) => b.inningsNo === 2);

  // Helper to calculate extra runs
  const calculateExtraRuns = (balls: typeof match.balls): ExtraRuns => {
    let wideRuns = 0;
    let noBallRuns = 0;
    let byeRuns = 0;
    let legByeRuns = 0;
    let penaltyRuns = 0;

    for (const ball of balls) {
      wideRuns += ball.wideRuns;
      noBallRuns += ball.noBallRuns;
      byeRuns += ball.byeRuns;
      legByeRuns += ball.legByeRuns;
      penaltyRuns += ball.penaltyRuns;
    }

    return { wideRuns, noBallRuns, byeRuns, legByeRuns, penaltyRuns };
  };

  // Helper to calculate batting performance
  const getBattingPerformances = (
    teamPlayers: typeof match.matchPlayers,
    balls: typeof match.balls,
  ): PlayerBattingPerformance[] => {
    const battingPlayers = teamPlayers
      .filter((mp) => mp.isPlayingEleven && mp.battingOrder !== null)
      .sort((a, b) => (a.battingOrder || 0) - (b.battingOrder || 0));

    const getPlayerNameById = (playerId: string | null): string => {
      if (!playerId) return "";
      const playerEntry = match.matchPlayers.find(
        (p) => p.playerId === playerId,
      );
      return playerEntry ? playerEntry.player.displayName : "";
    };

    return battingPlayers.map((mp) => {
      const playerBalls = balls.filter((b) => b.strikerId === mp.playerId);
      const runs = playerBalls.reduce((sum, b) => sum + b.batterRuns, 0);
      const facedBalls = playerBalls.filter(
        (b) => !b.isWide && !b.isDeadBall,
      ).length;
      const fours = playerBalls.filter((b) => b.boundaryType === "FOUR").length;
      const sixes = playerBalls.filter((b) => b.boundaryType === "SIX").length;
      const strikeRate =
        facedBalls > 0
          ? parseFloat(((runs / facedBalls) * 100).toFixed(2))
          : 0.0;

      const wicketBall = balls.find(
        (b) => b.isWicket && b.dismissedPlayerId === mp.playerId,
      );
      const isOut = Boolean(wicketBall);
      let dismissalInfo: string | null = null;

      if (wicketBall && wicketBall.dismissalType) {
        const type = wicketBall.dismissalType;
        const bowlerName = getPlayerNameById(wicketBall.bowlerId);
        const fielderName = getPlayerNameById(wicketBall.fielderId);

        if (type === "BOWLED") {
          dismissalInfo = `b. ${bowlerName}`;
        } else if (type === "LBW") {
          dismissalInfo = `lbw b. ${bowlerName}`;
        } else if (type === "CAUGHT") {
          if (
            wicketBall.fielderId &&
            wicketBall.fielderId === wicketBall.bowlerId
          ) {
            dismissalInfo = `c & b. ${bowlerName}`;
          } else if (fielderName) {
            dismissalInfo = `c. ${fielderName} b. ${bowlerName}`;
          } else {
            dismissalInfo = `c. b. ${bowlerName}`;
          }
        } else if (type === "STUMPED") {
          if (fielderName) {
            dismissalInfo = `st. ${fielderName} b. ${bowlerName}`;
          } else {
            dismissalInfo = `st. b. ${bowlerName}`;
          }
        } else if (type === "RUN_OUT") {
          if (fielderName) {
            dismissalInfo = `run out (${fielderName})`;
          } else {
            dismissalInfo = `run out`;
          }
        } else if (type === "HIT_WICKET") {
          dismissalInfo = `hit wicket b. ${bowlerName}`;
        } else if (type === "RETIRED_OUT") {
          dismissalInfo = `retired out`;
        } else if (type === "TIMED_OUT") {
          dismissalInfo = `timed out`;
        } else if (type === "HIT_BALL_TWICE") {
          dismissalInfo = `hit ball twice`;
        } else if (type === "OBSTRUCTING_FIELD") {
          dismissalInfo = `obstructing the field`;
        } else {
          dismissalInfo = `out`;
        }
      }

      return {
        id: mp.playerId,
        playerName: mp.player.playerName,
        runs,
        balls: facedBalls,
        fours,
        sixes,
        strikerRate: strikeRate,
        isOut,
        isCaptain: mp.isCaptain,
        isViceCaptain: mp.isViceCaptain,
        isWicketKeeper: mp.isWicketKeeper,
        dismissalInfo,
      };
    });
  };

  // Helper to calculate bowling performance
  const getBowlingPerformances = (
    teamPlayers: typeof match.matchPlayers,
    balls: typeof match.balls,
  ): PlayerBowlingPerformance[] => {
    const bowlerIds = new Set(balls.map((b) => b.bowlerId));
    const bowlingPlayers = teamPlayers
      .filter((mp) => mp.isPlayingEleven && bowlerIds.has(mp.playerId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return bowlingPlayers.map((mp) => {
      const bowledBalls = balls.filter((b) => b.bowlerId === mp.playerId);
      const legalDeliveries = bowledBalls.filter(
        (b) => !b.isWide && !b.isNoBall && !b.isDeadBall,
      ).length;
      const runs = bowledBalls.reduce(
        (sum, b) => sum + b.batterRuns + b.wideRuns + b.noBallRuns,
        0,
      );
      const wickets = bowledBalls.filter(
        (b) =>
          b.isWicket &&
          b.dismissalType &&
          ![
            "RUN_OUT",
            "RETIRED_OUT",
            "OBSTRUCTING_FIELD",
            "TIMED_OUT",
          ].includes(b.dismissalType),
      ).length;

      // Group balls by overNo to calculate maidens
      const ballsByOver: Record<number, typeof match.balls> = {};
      for (const ball of bowledBalls) {
        if (!ballsByOver[ball.overNo]) {
          ballsByOver[ball.overNo] = [];
        }
        const overList = ballsByOver[ball.overNo];
        if (overList) {
          overList.push(ball);
        }
      }

      let maidens = 0;
      for (const overNo of Object.keys(ballsByOver)) {
        const overBalls = ballsByOver[Number(overNo)] || [];
        const legalInOver = overBalls.filter(
          (b) => !b.isWide && !b.isNoBall && !b.isDeadBall,
        ).length;
        const runsInOver = overBalls.reduce(
          (sum, b) => sum + b.batterRuns + b.wideRuns + b.noBallRuns,
          0,
        );
        if (legalInOver === 6 && runsInOver === 0) {
          maidens += 1;
        }
      }

      const overs =
        Math.floor(legalDeliveries / 6) + (legalDeliveries % 6) * 0.1;
      const economy =
        legalDeliveries > 0
          ? parseFloat(((runs / legalDeliveries) * 6).toFixed(2))
          : 0.0;

      return {
        id: mp.playerId,
        playerName: mp.player.playerName,
        overs: parseFloat(overs.toFixed(1)),
        maidens,
        runs,
        wickets,
        economy,
        isCaptain: mp.isCaptain,
        isViceCaptain: mp.isViceCaptain,
        isWicketKeeper: mp.isWicketKeeper,
      };
    });
  };

  // Helper to find next batters
  const getNextBatters = (teamPlayers: typeof match.matchPlayers): string[] => {
    return teamPlayers
      .filter(
        (mp) =>
          mp.isPlayingEleven && mp.battingOrder === null && mp.order !== null,
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((mp) => mp.player.playerName);
  };

  // Helper to find fall of wickets
  const getFallOfWickets = (balls: typeof match.balls): FallOfWicket[] => {
    const sortedBalls = balls
      .slice()
      .sort((a, b) => a.deliveryNo - b.deliveryNo);
    const fallOfWicketList: FallOfWicket[] = [];
    let runningRuns = 0;

    const getPlayerNameById = (playerId: string | null): string => {
      if (!playerId) return "";
      const playerEntry = match.matchPlayers.find(
        (p) => p.playerId === playerId,
      );
      return playerEntry ? playerEntry.player.playerName : "";
    };

    for (const ball of sortedBalls) {
      runningRuns += ball.totalRuns;
      if (ball.isWicket && ball.dismissedPlayerId) {
        const playerName = getPlayerNameById(ball.dismissedPlayerId);
        const overVal = ball.overNo + ball.ballNo / 10;
        const wicketNo = fallOfWicketList.length + 1;
        fallOfWicketList.push({
          playerName,
          score: {
            run: runningRuns,
            wicket: wicketNo,
            overs: parseFloat(overVal.toFixed(1)),
          },
        });
      }
    }

    return fallOfWicketList;
  };

  // Helper to find partnerships
  const getPartnerships = (balls: typeof match.balls): Partnership[] => {
    const sortedBalls = balls
      .slice()
      .sort((a, b) => a.deliveryNo - b.deliveryNo);
    const partnerships: Partnership[] = [];

    if (sortedBalls.length === 0) return partnerships;

    let currentWicket = 1;
    let pRuns = 0;
    let pBalls = 0;

    let p1Id: string | null = null;
    let p2Id: string | null = null;
    let p1Runs = 0;
    let p1Balls = 0;
    let p2Runs = 0;
    let p2Balls = 0;

    const getPlayerNameById = (playerId: string | null): string => {
      if (!playerId) return "";
      const playerEntry = match.matchPlayers.find(
        (p) => p.playerId === playerId,
      );
      return playerEntry ? playerEntry.player.playerName : "";
    };

    for (const ball of sortedBalls) {
      // Maintain partnership player mapping based on current active players
      if (!p1Id && !p2Id) {
        p1Id = ball.strikerId;
        p2Id = ball.nonStrikerId;
      } else {
        if (p1Id !== ball.strikerId && p1Id !== ball.nonStrikerId) {
          p1Id = ball.strikerId === p2Id ? ball.nonStrikerId : ball.strikerId;
          p1Runs = 0;
          p1Balls = 0;
        }
        if (p2Id !== ball.strikerId && p2Id !== ball.nonStrikerId) {
          p2Id = ball.strikerId === p1Id ? ball.nonStrikerId : ball.strikerId;
          p2Runs = 0;
          p2Balls = 0;
        }
      }

      // Add runs and balls to the partnership
      const ballTotalRuns =
        ball.totalRuns !== undefined && ball.totalRuns !== null
          ? ball.totalRuns
          : (ball.batterRuns || 0) +
            (ball.wideRuns || 0) +
            (ball.noBallRuns || 0) +
            (ball.byeRuns || 0) +
            (ball.legByeRuns || 0) +
            (ball.penaltyRuns || 0);
      pRuns += ballTotalRuns;
      const isLegal = !ball.isWide && !ball.isDeadBall;
      if (isLegal) {
        pBalls += 1;
      }

      // Track individual runs and balls
      if (ball.strikerId === p1Id) {
        p1Runs += ball.batterRuns;
        if (isLegal) p1Balls += 1;
      } else if (ball.strikerId === p2Id) {
        p2Runs += ball.batterRuns;
        if (isLegal) p2Balls += 1;
      }

      // Check if a wicket fell
      if (ball.isWicket && ball.dismissedPlayerId) {
        // Save the partnership
        partnerships.push({
          runs: pRuns,
          balls: pBalls,
          wicket: currentWicket,
          player1Name: getPlayerNameById(p1Id),
          player1Runs: p1Runs,
          player1Balls: p1Balls,
          player2Name: getPlayerNameById(p2Id),
          player2Runs: p2Runs,
          player2Balls: p2Balls,
        });

        // Reset for the next partnership
        currentWicket += 1;
        pRuns = 0;
        pBalls = 0;

        // Identify who was dismissed, and reset their slot
        const dismissedId = ball.dismissedPlayerId;
        if (dismissedId === p1Id) {
          p1Id = null;
        } else if (dismissedId === p2Id) {
          p2Id = null;
        } else {
          // Fallback
          p1Id = null;
        }
      }
    }

    // If there is an ongoing partnership at the end of the innings, add it
    if (p1Id || p2Id || pRuns > 0 || pBalls > 0) {
      partnerships.push({
        runs: pRuns,
        balls: pBalls,
        wicket: currentWicket,
        player1Name: getPlayerNameById(p1Id),
        player1Runs: p1Runs,
        player1Balls: p1Balls,
        player2Name: getPlayerNameById(p2Id),
        player2Runs: p2Runs,
        player2Balls: p2Balls,
      });
    }

    return partnerships;
  };

  const homePlayers = match.matchPlayers.filter(
    (mp) => mp.teamId === match.homeTeamId,
  );
  const awayPlayers = match.matchPlayers.filter(
    (mp) => mp.teamId === match.awayTeamId,
  );

  return {
    firstInning: {
      id: match.homeTeamId,
      teamName: match.homeTeam.teamName,
      shortName: match.homeTeam.shortName,
      logoUrl: match.homeTeam.logoUrl,
      score: {
        run: match.firstIningRuns,
        wicket: match.firstIningWickets,
        overs: match.firstIningOvers,
      },
      playerBattingPerformance: getBattingPerformances(
        homePlayers,
        firstIningBalls,
      ),
      playerBowlingPerformance: getBowlingPerformances(
        homePlayers,
        secondIningBalls,
      ),
      nextbatters: getNextBatters(homePlayers),
      extraRuns: calculateExtraRuns(firstIningBalls),
      fallOfWicket: getFallOfWickets(firstIningBalls),
      partnership: getPartnerships(firstIningBalls),
    },
    secondInning: {
      id: match.awayTeamId,
      teamName: match.awayTeam.teamName,
      shortName: match.awayTeam.shortName,
      logoUrl: match.awayTeam.logoUrl,
      score: {
        run: match.secondIningRuns,
        wicket: match.secondIningWickets,
        overs: match.secondIningOvers,
      },
      playerBattingPerformance: getBattingPerformances(
        awayPlayers,
        secondIningBalls,
      ),
      playerBowlingPerformance: getBowlingPerformances(
        awayPlayers,
        firstIningBalls,
      ),
      nextbatters: getNextBatters(awayPlayers),
      extraRuns: calculateExtraRuns(secondIningBalls),
      fallOfWicket: getFallOfWickets(secondIningBalls),
      partnership: getPartnerships(secondIningBalls),
    },
  };
};
