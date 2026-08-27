import type { Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import ApiError from "../../utils/ApiError.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

import type { CreateOrganizationBody } from "./organization.schema.js";
import {
  createOrganizationForUser,
  findOrganizationProfileId,
} from "./organization.service.js";

export const getMyOrganization = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required.");
    }

    const onboarded = await findOrganizationProfileId(userId);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Organization onboarding status fetched successfully.",
      data: {
        onboarded: Boolean(onboarded),
      },
    });
  },
);

export const createOrganization = asyncHandler(
  async (
    req: AuthenticatedRequest<unknown, unknown, CreateOrganizationBody>,
    res: Response,
  ) => {
    const user = req.authUser;

    if (!user) {
      throw ApiError.unauthorized("Authentication required.");
    }

    await createOrganizationForUser(user.id, user.avatarUrl, req.body);

    return sendResponse({
      res,
      statusCode: 201,
      message: "Organization profile created successfully.",
    });
  },
);
