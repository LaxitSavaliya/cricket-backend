import type { Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import ApiError from "../../utils/ApiError.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

import type { CreatePlayerBody } from "./player.schema.js";
import { createPlayerForUser, findPlayerProfileId } from "./player.service.js";

export const getMyPlayer = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required.");
    }

    const onboarded = await findPlayerProfileId(userId);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Player onboarding status fetched successfully.",
      data: {
        onboarded: Boolean(onboarded),
      },
    });
  },
);

export const createPlayer = asyncHandler(
  async (
    req: AuthenticatedRequest<unknown, unknown, CreatePlayerBody>,
    res: Response,
  ) => {
    const user = req.authUser;

    if (!user) {
      throw ApiError.unauthorized("Authentication required.");
    }

    await createPlayerForUser(user.id, user.avatarUrl, req.body);

    return sendResponse({
      res,
      statusCode: 201,
      message: "Player profile created successfully.",
    });
  },
);
