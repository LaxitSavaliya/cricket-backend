import { OAuth2Client, type LoginTicket } from "google-auth-library";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import ApiError from "../../utils/ApiError.js";
import type { AuthUser, GoogleLoginResult } from "./auth.types.js";

/**
 * Verifies Google ID token, ensures user exists (or creates/syncs profile),
 * and returns the authenticated user.
 */

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

/**
 * Verifies the Google ID token, creates/synchronizes the user,
 * and returns the internal user ID for session creation.
 */
export async function loginWithGoogle(
  idToken: string,
): Promise<GoogleLoginResult> {
  const trimmedToken = idToken?.trim();

  if (!trimmedToken) {
    throw ApiError.badRequest("Google ID token is required.");
  }

  let ticket: LoginTicket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: trimmedToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw ApiError.unauthorized("Invalid or expired Google ID token.");
  }

  const payload = ticket.getPayload();

  if (!payload) {
    throw ApiError.unauthorized("Invalid Google token payload.");
  }

  const { sub, email, name, picture, email_verified: emailVerified } = payload;

  if (!sub?.trim()) {
    throw ApiError.unauthorized("Google account identity is missing.");
  }

  if (!email?.trim()) {
    throw ApiError.unauthorized("Google account email is missing.");
  }

  if (!emailVerified) {
    throw ApiError.unauthorized("Google account email is not verified.");
  }

  const normalizedSub = sub.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const normalizedName =
    typeof name === "string" && name.trim() ? name.trim() : null;

  const normalizedAvatarUrl =
    typeof picture === "string" && picture.trim() ? picture.trim() : null;

  let user = await prisma.user.findUnique({
    where: {
      googleId: normalizedSub,
    },
    select: AUTH_USER_SELECT,
  });

  if (user) {
    const hasChanges =
      user.email !== normalizedEmail ||
      user.name !== normalizedName ||
      user.avatarUrl !== normalizedAvatarUrl;

    if (hasChanges) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          email: normalizedEmail,
          name: normalizedName,
          avatarUrl: normalizedAvatarUrl,
        },
        select: AUTH_USER_SELECT,
      });
    }

    return {
      userId: user.id,
    };
  }

  const existingEmailUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      googleId: true,
    },
  });

  if (existingEmailUser && existingEmailUser.googleId !== normalizedSub) {
    throw ApiError.conflict(
      "An account already exists with this email address.",
    );
  }

  user = await prisma.user.create({
    data: {
      googleId: normalizedSub,
      email: normalizedEmail,
      name: normalizedName,
      avatarUrl: normalizedAvatarUrl,
    },
    select: AUTH_USER_SELECT,
  });

  return {
    userId: user.id,
  };
}

/**
 * Retrieves the current authenticated user by their ID.
 */
export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const trimmedUserId = userId?.trim();

  if (!trimmedUserId) {
    throw ApiError.unauthorized("Authentication required.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: trimmedUserId,
    },
    select: AUTH_USER_SELECT,
  });

  if (!user) {
    throw ApiError.unauthorized("Authenticated user no longer exists.");
  }

  return user;
}
