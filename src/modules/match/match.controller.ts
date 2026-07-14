import type { Request, Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import {
  getAllMatches,
  getMatchBySlug,
  getMatchPlayersBySlug,
} from "./match.service.js";
import type {
  MatchDetailsBySlug,
  MatchListItem,
  MatchPlayersResponse,
} from "./match.types.js";

type MatchSlugParams = {
  slug: string;
};

export const getMatches = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const matches = await getAllMatches();

    sendResponse<MatchListItem[]>({
      res,
      message: "Matches fetched successfully.",
      data: matches,
    });
  },
);

export const getMatch = asyncHandler<MatchSlugParams>(
  async (req, res): Promise<void> => {
    const match = await getMatchBySlug(req.params.slug);

    if (!match) {
      sendResponse<null>({
        res,
        statusCode: 404,
        message: "Match not found.",
        data: null,
      });

      return;
    }

    sendResponse<MatchDetailsBySlug>({
      res,
      message: "Match fetched successfully.",
      data: match,
    });
  },
);

export const getMatchPlayers = asyncHandler<MatchSlugParams>(
  async (req, res): Promise<void> => {
    const matchPlayers = await getMatchPlayersBySlug(req.params.slug);

    if (!matchPlayers) {
      sendResponse<null>({
        res,
        statusCode: 404,
        message: "Match not found.",
        data: null,
      });

      return;
    }

    sendResponse<MatchPlayersResponse>({
      res,
      message: "Match players fetched successfully.",
      data: matchPlayers,
    });
  },
);
