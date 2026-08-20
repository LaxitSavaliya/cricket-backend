import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

import type { GoogleLoginBody } from "./auth.schema.js";
import { loginWithGoogle } from "./auth.service.js";
import type { AuthenticatedRequest, GoogleLoginResult } from "./auth.types.js";

const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  maxAge: env.AUTH_SESSION_TTL_SECONDS * 1000,
  path: "/",
});

export const googleLogin = asyncHandler(
  async (req: Request<unknown, unknown, GoogleLoginBody>, res: Response) => {
    const { idToken } = req.body;

    const result: GoogleLoginResult = await loginWithGoogle(idToken);

    const token = jwt.sign(
      {
        sub: result.userId,
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

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser;

    if (!user) {
      throw ApiError.unauthorized("Authentication required.");
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "Current user fetched successfully.",
      data: user,
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
