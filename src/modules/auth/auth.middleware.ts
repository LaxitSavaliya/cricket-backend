import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { getCurrentUser } from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.types.js";

/**
 * Extracts JWT token from either the HTTP-only cookie or the Authorization Bearer header.
 */
function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader =
    req.headers["authorization"] ?? req.headers["Authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return null;
}

/**
 * Middleware that strictly verifies JWT authentication from cookie or Authorization header.
 * Attaches `{ userId }` to `req.auth`.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);

  if (!token) {
    next(ApiError.unauthorized("Authentication required. Please log in."));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub.trim().length === 0
    ) {
      next(ApiError.unauthorized("Invalid session token payload."));
      return;
    }

    req.auth = {
      userId: payload.sub.trim(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Session expired. Please log in again."));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid session token."));
      return;
    }

    next(ApiError.unauthorized("Authentication failed."));
  }
}

/**
 * Middleware that loads the full user profile from database based on `req.auth.userId`.
 * Attaches user to `req.authUser`. Must be placed after `requireAuth`.
 */
export async function requireUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.authUser) {
      next();
      return;
    }

    const userId = req.auth?.userId;

    if (!userId) {
      next(ApiError.unauthorized("Authentication required."));
      return;
    }

    const user = await getCurrentUser(userId);

    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
