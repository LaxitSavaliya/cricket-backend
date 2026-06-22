import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";

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
} satisfies Prisma.MatchSelect;

export type MatchListItem = Prisma.MatchGetPayload<{
  select: typeof matchListSelect;
}>;

export const getAllMatches = async (): Promise<MatchListItem[]> => {
  return prisma.match.findMany({
    select: matchListSelect,
    orderBy: {
      matchDate: "desc",
    },
  });
};

export type MatchDetails = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
    tossWinnerTeam: true;
    winnerTeam: true;
  };
}>;

export const getMatchById = async (id: string): Promise<MatchDetails> => {
  const match = await prisma.match.findUnique({
    where: {
      id,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tossWinnerTeam: true,
      winnerTeam: true,
    },
  });

  if (!match) {
    throw ApiError.notFound(`Match with ID ${id} not found`);
  }

  return match;
};
