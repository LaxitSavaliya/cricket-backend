import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";

import type { CreateTournamentBody } from "./tournament.schema.js";
import {
  tournamentSelect,
  type TournamentListItem,
  type TournamentListOptions,
  type TournamentListResult,
  type TournamentQueryResult,
  type TournamentSortBy,
  type TournamentSortOrder,
} from "./tournament.types.js";

const SMALL_LIST_LIMIT = 15;
const PAGE_SIZE = 12;

const formatTournamentListItem = (
  tournament: TournamentQueryResult,
): TournamentListItem => {
  return {
    name: tournament.name,
    slug: tournament.slug,
    logoUrl: tournament.logoUrl,
    city: tournament.city,
    state: tournament.state,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    teamsCount: tournament._count.teams,
  };
};

const buildOrderBy = (
  sortBy: TournamentSortBy,
  sortOrder: TournamentSortOrder,
): Prisma.TournamentOrderByWithRelationInput[] => {
  if (sortBy === "teamsCount") {
    return [
      {
        teams: {
          _count: sortOrder,
        },
      },
      {
        id: "asc",
      },
    ];
  }

  if (sortBy === "name") {
    return [
      {
        name: sortOrder,
      },
      {
        id: "asc",
      },
    ];
  }

  return [
    {
      createdAt: sortOrder,
    },
    {
      id: "asc",
    },
  ];
};

export const getAllTournaments = async (
  organizationId: string,
  options: TournamentListOptions,
): Promise<TournamentListResult> => {
  const normalizedSearch = options.search?.trim();

  const where: Prisma.TournamentWhereInput = {
    organizationId,
    ...(normalizedSearch
      ? {
          OR: [
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              state: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.tournament.count({
    where,
  });

  const take =
    options.offset === 0 && total <= SMALL_LIST_LIMIT
      ? SMALL_LIST_LIMIT
      : PAGE_SIZE;

  const tournaments = await prisma.tournament.findMany({
    where,
    select: tournamentSelect,
    skip: options.offset,
    take,
    orderBy: buildOrderBy(options.sortBy, options.sortOrder),
  });

  const items = tournaments.map(formatTournamentListItem);

  const loadedUntil = options.offset + items.length;

  const nextOffset = loadedUntil < total ? loadedUntil : null;

  return {
    items,
    total,
    nextOffset,
    hasMore: nextOffset !== null,
  };
};

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueTournamentSlug(name: string): Promise<string> {
  const baseSlug = createSlug(name);

  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createTournamentForOrganization(
  organizationId: string,
  input: CreateTournamentBody,
): Promise<TournamentListItem> {
  const slug = await generateUniqueTournamentSlug(input.name);

  const tournament = await prisma.tournament.create({
    data: {
      organizationId,
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
    },
    select: tournamentSelect,
  });

  return formatTournamentListItem(tournament);
}
