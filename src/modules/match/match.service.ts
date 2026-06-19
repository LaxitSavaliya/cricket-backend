import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";

const matchListSelect = {
  id: true,
  title: true,
  matchFormat: true,
  status: true,
  matchDate: true,
  matchTextResult: true,
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
