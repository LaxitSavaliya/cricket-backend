import type { Prisma } from "../../generated/prisma/client.js";

const matchTeamSelect = {
  id: true,
  teamName: true,
  slug: true,
  logoUrl: true,
} satisfies Prisma.TeamSelect;

const matchPlayerProfileSelect = {
  id: true,
  playerName: true,
  displayName: true,
  slug: true,
  role: true,
  photoUrl: true,
} satisfies Prisma.PlayerSelect;

export type MatchTeamQueryResult = Prisma.TeamGetPayload<{
  select: typeof matchTeamSelect;
}>;

/*
|--------------------------------------------------------------------------
| Match list
|--------------------------------------------------------------------------
*/

export const matchListSelect = {
  id: true,
  title: true,
  slug: true,
  matchFormat: true,
  status: true,
  matchDate: true,

  // Used internally to match each innings with the correct team.
  homeTeamId: true,
  awayTeamId: true,

  tossWinnerTeamId: true,
  tossDecision: true,

  homeTeam: {
    select: matchTeamSelect,
  },

  awayTeam: {
    select: matchTeamSelect,
  },

  innings: {
    select: {
      teamId: true,
      inningsNo: true,
      runs: true,
      wickets: true,
      balls: true,
    },

    orderBy: {
      inningsNo: "asc",
    },
  },
} satisfies Prisma.MatchSelect;

export type MatchListQueryResult = Prisma.MatchGetPayload<{
  select: typeof matchListSelect;
}>;

export type MatchInningSummary = MatchListQueryResult["innings"][number];

export type MatchTeamDetails = MatchTeamQueryResult & {
  shortName: string;
};

export type MatchTeamSummary = MatchTeamDetails & {
  inningsNo: MatchInningSummary["inningsNo"] | null;
  runs: number;
  wickets: number;
  balls: number;
};

export type CompletedMatchResult =
  | {
      type: "RUNS";
      winnerTeamId: string;
      margin: number;
      text: string;
    }
  | {
      type: "WICKETS";
      winnerTeamId: string;
      margin: number;
      text: string;
    }
  | {
      type: "TIED";
      winnerTeamId: null;
      margin: null;
      text: string;
    };

export type MatchListItem = Omit<
  MatchListQueryResult,
  "homeTeamId" | "awayTeamId" | "homeTeam" | "awayTeam" | "innings"
> & {
  homeTeam: MatchTeamSummary;
  awayTeam: MatchTeamSummary;
  result: CompletedMatchResult | null;
};

/*
|--------------------------------------------------------------------------
| Single match details
|--------------------------------------------------------------------------
*/

export const matchDetailsBySlugSelect = {
  id: true,
  title: true,
  slug: true,
  matchFormat: true,
  status: true,
  matchDate: true,
  venue: true,
  city: true,
  tossWinnerTeamId: true,
  tossDecision: true,

  homeTeam: {
    select: matchTeamSelect,
  },

  awayTeam: {
    select: matchTeamSelect,
  },
} satisfies Prisma.MatchSelect;

export type MatchDetailsBySlugQueryResult = Prisma.MatchGetPayload<{
  select: typeof matchDetailsBySlugSelect;
}>;

export type MatchDetailsBySlug = Omit<
  MatchDetailsBySlugQueryResult,
  "homeTeam" | "awayTeam"
> & {
  homeTeam: MatchTeamDetails;
  awayTeam: MatchTeamDetails;
};

/*
|--------------------------------------------------------------------------
| Match players
|--------------------------------------------------------------------------
*/

export const matchPlayersBySlugSelect = {
  homeTeam: {
    select: matchTeamSelect,
  },

  awayTeam: {
    select: matchTeamSelect,
  },

  players: {
    select: {
      teamId: true,
      isPlaying: true,
      isCaptain: true,
      isViceCaptain: true,
      isWicketKeeper: true,
      lineupOrder: true,

      player: {
        select: matchPlayerProfileSelect,
      },
    },

    orderBy: [
      {
        teamId: "asc",
      },
      {
        isPlaying: "desc",
      },
      {
        lineupOrder: "asc",
      },
      {
        player: {
          playerName: "asc",
        },
      },
    ],
  },
} satisfies Prisma.MatchSelect;

export type MatchPlayersBySlugQueryResult = Prisma.MatchGetPayload<{
  select: typeof matchPlayersBySlugSelect;
}>;

export type MatchPlayerQueryResult =
  MatchPlayersBySlugQueryResult["players"][number];

export type MatchPlayerItem = {
  id: MatchPlayerQueryResult["player"]["id"];
  playerName: MatchPlayerQueryResult["player"]["playerName"];
  displayName: string;
  slug: MatchPlayerQueryResult["player"]["slug"];
  role: MatchPlayerQueryResult["player"]["role"];
  photoUrl: MatchPlayerQueryResult["player"]["photoUrl"];

  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
  lineupOrder: number | null;
};

export type MatchPlayersTeam = MatchTeamDetails & {
  players: MatchPlayerItem[];
  benchPlayers: MatchPlayerItem[];
};

export type MatchPlayersResponse = {
  homeTeam: MatchPlayersTeam;
  awayTeam: MatchPlayersTeam;
};

/*
|--------------------------------------------------------------------------
| Match score
|--------------------------------------------------------------------------
*/

const matchScorePlayerProfileSelect = {
  playerName: true,
  slug: true,
} satisfies Prisma.PlayerSelect;

export const matchScoreBySlugSelect = {
  players: {
    select: {
      id: true,
      teamId: true,
      isPlaying: true,

      lineupOrder: true,
      battingOrder: true,

      didBat: true,
      runsScored: true,
      ballsFaced: true,
      fours: true,
      sixes: true,
      isOut: true,
      dismissalType: true,

      didBowl: true,
      legalBallsBowled: true,
      maidens: true,
      runsConceded: true,
      wickets: true,

      player: {
        select: matchScorePlayerProfileSelect,
      },
    },
  },

  innings: {
    select: {
      id: true,
      teamId: true,
      inningsNo: true,
      runs: true,
      wickets: true,
      balls: true,

      team: {
        select: matchTeamSelect,
      },

      ballsData: {
        select: {
          deliveryNo: true,
          overNo: true,
          ballNo: true,

          strikerMatchPlayerId: true,
          nonStrikerMatchPlayerId: true,
          bowlerMatchPlayerId: true,

          isLegalDelivery: true,
          isDeadBall: true,
          isWide: true,
          isNoBall: true,
          isWicket: true,

          batterRuns: true,
          noBallRuns: true,
          wideRuns: true,
          byeRuns: true,
          legByeRuns: true,
          penaltyRuns: true,
          totalRuns: true,

          dismissalType: true,
          dismissedMatchPlayerId: true,

          fielderMatchPlayerId: true,
          assistFielderMatchPlayerId: true,

          bowlerMatchPlayer: {
            select: {
              player: {
                select: matchScorePlayerProfileSelect,
              },
            },
          },

          fielderMatchPlayer: {
            select: {
              player: {
                select: matchScorePlayerProfileSelect,
              },
            },
          },

          assistFielderMatchPlayer: {
            select: {
              player: {
                select: matchScorePlayerProfileSelect,
              },
            },
          },
        },

        orderBy: {
          deliveryNo: "asc",
        },
      },
    },

    orderBy: {
      inningsNo: "asc",
    },
  },
} satisfies Prisma.MatchSelect;

export type MatchScoreBySlugQueryResult = Prisma.MatchGetPayload<{
  select: typeof matchScoreBySlugSelect;
}>;

export type MatchScoreInningQueryResult =
  MatchScoreBySlugQueryResult["innings"][number];

export type MatchScoreBallQueryResult =
  MatchScoreInningQueryResult["ballsData"][number];

export type MatchScorePlayerQueryResult =
  MatchScoreBySlugQueryResult["players"][number];

export type MatchScorePlayer = {
  playerName: string;
  slug: string;
};

export type MatchScoreBatter = MatchScorePlayer & {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalText: string;
};

export type MatchScoreExtras = {
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  penalties: number;
  total: number;
};

export type MatchScoreBowler = MatchScorePlayer & {
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economyRate: number;
};

export type MatchScoreFallOfWicket = MatchScorePlayer & {
  overs: number;
  runs: number;
  wicketNo: number;
};

export type MatchScorePartnershipBatter = MatchScorePlayer & {
  runs: number;
  balls: number;
};

export type MatchScorePartnership = {
  forWicket: number;
  runs: number;
  balls: number;
  firstBatter: MatchScorePartnershipBatter;
  secondBatter: MatchScorePartnershipBatter;
};

export type MatchScoreInning = {
  teamName: string;
  shortName: string;
  slug: string;
  logoUrl: string | null;
  runs: number;
  overs: number;
  wickets: number;

  score: {
    batters: MatchScoreBatter[];
    extras: MatchScoreExtras;
    notBat: MatchScorePlayer[];
    bowlers: MatchScoreBowler[];
    fallOfWickets: MatchScoreFallOfWicket[];
    partnerships: MatchScorePartnership[];
  };
};

export type MatchScoreResponse = {
  firstInning: MatchScoreInning | null;
  secondInning: MatchScoreInning | null;
};

/*
|--------------------------------------------------------------------------
| Match commentary
|--------------------------------------------------------------------------
*/

export const matchCommentaryBySlugSelect = {
  id: true,
  matchFormat: true,
  matchDate: true,

  innings: {
    select: {
      inningsNo: true,

      ballsData: {
        select: {
          deliveryNo: true,
          overNo: true,
          ballNo: true,
          commentaryText: true,
          strikerMatchPlayer: {
            select: {
              playerId: true,
              player: {
                select: {
                  playerName: true,
                  slug: true,
                  photoUrl: true,
                },
              },
            },
          },
          nonStrikerMatchPlayer: {
            select: {
              playerId: true,
              player: {
                select: {
                  playerName: true,
                  slug: true,
                  photoUrl: true,
                },
              },
            },
          },
          bowlerMatchPlayer: {
            select: {
              playerId: true,
              player: {
                select: {
                  playerName: true,
                  slug: true,
                  photoUrl: true,
                },
              },
            },
          },
        },

        orderBy: {
          deliveryNo: "desc",
        },
      },
    },

    orderBy: {
      inningsNo: "asc",
    },
  },
} satisfies Prisma.MatchSelect;

export type MatchCommentaryBySlugQueryResult = Prisma.MatchGetPayload<{
  select: typeof matchCommentaryBySlugSelect;
}>;

export type MatchCommentaryInningQueryResult =
  MatchCommentaryBySlugQueryResult["innings"][number];

export type MatchCommentaryItem = {
  deliveryNo: number;
  overNo: number;
  ballNo: number;
  commentaryText: string;
};

export type MatchBatterIntro = {
  playerName: string;
  slug: string;
  photoUrl: string | null;
  deliveryNo: number;
  matches: number;
  runs: number;
  strikeRate: number;
  average: number;
  best: string;
};

export type MatchBowlerIntro = {
  playerName: string;
  slug: string;
  photoUrl: string | null;
  deliveryNo: number;
  matches: number;
  wickets: number;
  average: number;
  economy: number;
  best: string;
};

export type MatchInningCommentary = {
  batterIntro: MatchBatterIntro[];
  bowlerIntro: MatchBowlerIntro[];
  commentary: MatchCommentaryItem[];
};

export type MatchCommentaryResponse = {
  firstInning: MatchInningCommentary | null;
  secondInning: MatchInningCommentary | null;
};
