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
      battingOrder: true,
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
    orderBy: { battingOrder: "asc" as const },
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
