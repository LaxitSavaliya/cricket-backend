import type { CookieOptions, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

import type { GoogleLoginBody } from "./auth.schema.js";
import { loginWithGoogle } from "./auth.service.js";
import { AUTH_PORTAL, type AuthenticatedRequest } from "./auth.types.js";

const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  maxAge: env.AUTH_SESSION_TTL_SECONDS * 1000,
  path: "/",
});

const googleLoginHandler = (portal: AUTH_PORTAL): RequestHandler =>
  asyncHandler(
    async (req: Request<unknown, unknown, GoogleLoginBody>, res: Response) => {
      const { idToken } = req.body;

      const userId = await loginWithGoogle(idToken);

      const token = jwt.sign(
        {
          sub: userId,
          portal,
        },
        env.JWT_SECRET,
        {
          algorithm: "HS256",
          expiresIn: env.AUTH_SESSION_TTL_SECONDS,
        },
      );

      res.cookie(env.AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      return sendResponse({
        res,
        statusCode: 200,
        message: "Google login successful.",
      });
    },
  );

export const playerGoogleLogin = googleLoginHandler(AUTH_PORTAL.PLAYER);

export const organizationGoogleLogin = googleLoginHandler(
  AUTH_PORTAL.ORGANIZATION,
);

export const checkSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.authUser) {
      throw ApiError.unauthorized("Authentication required.");
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "Authenticated.",
    });
  },
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const { maxAge: _unused, ...clearCookieOptions } = getAuthCookieOptions();

  res.clearCookie(env.AUTH_COOKIE_NAME, clearCookieOptions);

  return sendResponse({
    res,
    statusCode: 200,
    message: "Logged out successfully.",
  });
});
