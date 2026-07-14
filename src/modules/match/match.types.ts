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

export type MatchListItem = Omit<
  MatchListQueryResult,
  "homeTeamId" | "awayTeamId" | "homeTeam" | "awayTeam" | "innings"
> & {
  homeTeam: MatchTeamSummary;
  awayTeam: MatchTeamSummary;
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

      player: {
        select: matchPlayerProfileSelect,
      },
    },

    orderBy: [
      {
        isPlaying: "desc",
      },
      {
        isCaptain: "desc",
      },
      {
        isViceCaptain: "desc",
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
  role: MatchPlayerQueryResult["player"]["role"];
  photoUrl: MatchPlayerQueryResult["player"]["photoUrl"];
  isCaptain: boolean;
  isViceCaptain: boolean;
};

export type MatchPlayersTeam = MatchTeamDetails & {
  players: MatchPlayerItem[];
  benchPlayers: MatchPlayerItem[];
};

export type MatchPlayersResponse = {
  homeTeam: MatchPlayersTeam;
  awayTeam: MatchPlayersTeam;
};
