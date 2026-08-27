import { prisma } from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";

import type { CreateOrganizationBody } from "./organization.schema.js";

export async function findOrganizationProfileId(
  userId: string,
): Promise<{ id: string } | null> {
  const trimmedUserId = userId?.trim();

  if (!trimmedUserId) {
    return null;
  }

  return await prisma.organization.findUnique({
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

async function generateUniqueOrganizationSlug(name: string): Promise<string> {
  const baseSlug = createSlug(name);

  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createOrganizationForUser(
  userId: string,
  logoUrl: string | null,
  input: CreateOrganizationBody,
): Promise<void> {
  const existingOrganization = await prisma.organization.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (existingOrganization) {
    throw ApiError.conflict("Organization profile already exists.");
  }

  const slug = await generateUniqueOrganizationSlug(
    input.displayName ?? input.name,
  );

  await prisma.organization.create({
    data: {
      userId,

      name: input.name,
      displayName: input.displayName ?? null,

      slug,
      logoUrl: logoUrl,

      city: input.city ?? null,
      state: input.state ?? null,
    },
  });
}
