import type { Prisma } from "../../generated/prisma/client.js";

export const tournamentSelect = {
  name: true,
  slug: true,
  logoUrl: true,
  city: true,
  state: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      teams: true,
    },
  },
} satisfies Prisma.TournamentSelect;

export type TournamentQueryResult = Prisma.TournamentGetPayload<{
  select: typeof tournamentSelect;
}>;

export type TournamentListItem = {
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  updatedAt: Date;
  teamsCount: number;
};

export type TournamentSortBy = "createdAt" | "name" | "teamsCount";

export type TournamentSortOrder = "asc" | "desc";

export interface TournamentListOptions {
  offset: number;
  search?: string | undefined;
  sortBy: TournamentSortBy;
  sortOrder: TournamentSortOrder;
}

export interface TournamentListResult {
  items: TournamentListItem[];
  total: number;
  nextOffset: number | null;
  hasMore: boolean;
}

export const tournamentTeamSelect = {
  teamName: true,
  slug: true,
  logoUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TeamSelect;

export type TournamentTeamQueryResult = Prisma.TeamGetPayload<{
  select: typeof tournamentTeamSelect;
}>;

export type TournamentTeamItem = {
  teamName: string;
  slug: string;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};
