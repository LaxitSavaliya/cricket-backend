import { prisma } from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";

import type { CreatePlayerBody } from "./player.schema.js";

export async function findPlayerProfileId(
  userId: string,
): Promise<{ id: string } | null> {
  const trimmedUserId = userId?.trim();

  if (!trimmedUserId) {
    return null;
  }

  return prisma.player.findUnique({
    where: {
      userId: trimmedUserId,
    },
    select: {
      id: true,
    },
  });
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniquePlayerSlug(name: string): Promise<string> {
  const baseSlug = createSlug(name);

  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.player.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createPlayerForUser(
  userId: string,
  avatarUrl: string | null,
  input: CreatePlayerBody,
): Promise<void> {
  const existingPlayer = await prisma.player.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (existingPlayer) {
    throw ApiError.conflict("Player profile already exists.");
  }

  const slug = await generateUniquePlayerSlug(input.displayName ?? input.name);

  await prisma.player.create({
    data: {
      userId,

      name: input.name,
      displayName: input.displayName ?? null,

      slug,
      photoUrl: avatarUrl,

      role: input.role,
      canKeepWickets: input.canKeepWickets,

      battingStyle: input.battingStyle ?? null,
      bowlingStyle: input.bowlingStyle ?? null,

      city: input.city ?? null,
      state: input.state ?? null,

      birthDate: input.birthDate
        ? new Date(`${input.birthDate}T00:00:00.000Z`)
        : null,
    },
  });
}
