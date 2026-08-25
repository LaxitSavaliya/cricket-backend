import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { getCurrentUser } from "./auth.service.js";
import { AUTH_PORTAL, type AuthenticatedRequest } from "./auth.types.js";

interface JwtSessionPayload extends jwt.JwtPayload {
  sub: string;
  portal: AUTH_PORTAL;
}

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
 * Validates sub (userId) and portal claims, then attaches `{ userId, portal }` to `req.auth`.
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
    }) as JwtSessionPayload;

    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.sub !== "string" ||
      payload.sub.trim().length === 0
    ) {
      next(ApiError.unauthorized("Invalid session token payload."));
      return;
    }

    const validPortals = Object.values(AUTH_PORTAL);
    if (!validPortals.includes(payload.portal)) {
      next(ApiError.unauthorized("Invalid session token portal claim."));
      return;
    }

    req.auth = {
      userId: payload.sub.trim(),
      portal: payload.portal,
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
function requirePortalUser(requiredPortal: AUTH_PORTAL) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const auth = req.auth;

      if (!auth) {
        next(ApiError.unauthorized("Authentication required."));
        return;
      }

      if (auth.portal !== requiredPortal) {
        next(
          ApiError.unauthorized(
            `You are not authorized to access the ${requiredPortal} portal.`,
          ),
        );
        return;
      }

      if (req.authUser) {
        next();
        return;
      }

      const user = await getCurrentUser(auth.userId);

      req.authUser = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requirePlayerUser = requirePortalUser(AUTH_PORTAL.PLAYER);

export const requireOrganizationUser = requirePortalUser(
  AUTH_PORTAL.ORGANIZATION,
);
