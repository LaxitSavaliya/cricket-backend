import type { Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import ApiError from "../../utils/ApiError.js";

import type { AuthenticatedRequest } from "../auth/auth.types.js";

import { getAllTournaments } from "./tournament.service.js";

import type {
  TournamentListResult,
  TournamentSortBy,
  TournamentSortOrder,
} from "./tournament.types.js";

const ALLOWED_SORT_FIELDS = ["createdAt", "name", "teamsCount"] as const;

const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

export const getTournaments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const organizationId = req.organizationId;

    if (!organizationId) {
      throw ApiError.forbidden("Organization profile not found.");
    }

    const rawOffset = req.query["offset"];
    const rawSearch = req.query["search"];
    const rawSortBy = req.query["sortBy"];
    const rawSortOrder = req.query["sortOrder"];

    if (rawOffset !== undefined && typeof rawOffset !== "string") {
      throw ApiError.badRequest("Invalid tournament offset.");
    }

    const offset = rawOffset === undefined ? 0 : Number(rawOffset);

    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw ApiError.badRequest(
        "Tournament offset must be a non-negative integer.",
      );
    }

    if (rawSearch !== undefined && typeof rawSearch !== "string") {
      throw ApiError.badRequest("Invalid tournament search value.");
    }

    const search = rawSearch?.trim();

    if (search && search.length > 100) {
      throw ApiError.badRequest(
        "Tournament search cannot exceed 100 characters.",
      );
    }

    const sortByValue = typeof rawSortBy === "string" ? rawSortBy : "createdAt";

    if (!ALLOWED_SORT_FIELDS.includes(sortByValue as TournamentSortBy)) {
      throw ApiError.badRequest("Invalid tournament sorting field.");
    }

    const sortOrderValue =
      typeof rawSortOrder === "string" ? rawSortOrder : "desc";

    if (!ALLOWED_SORT_ORDERS.includes(sortOrderValue as TournamentSortOrder)) {
      throw ApiError.badRequest("Invalid tournament sorting order.");
    }

    const result = await getAllTournaments(organizationId, {
      offset,
      search,
      sortBy: sortByValue as TournamentSortBy,
      sortOrder: sortOrderValue as TournamentSortOrder,
    });

    return sendResponse<TournamentListResult>({
      res,
      statusCode: 200,
      message: "Tournaments fetched successfully.",
      data: result,
    });
  },
);
