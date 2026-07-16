import type { Request, Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import {
  getAllMatches,
  getMatchBySlug,
  getMatchCommentaryBySlug,
  getMatchPlayersBySlug,
  getMatchScoreBySlug,
} from "./match.service.js";
import type {
  MatchCommentaryResponse,
  MatchDetailsBySlug,
  MatchListItem,
  MatchPlayersResponse,
  MatchScoreResponse,
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

export const getMatchScore = asyncHandler<MatchSlugParams>(
  async (req, res): Promise<void> => {
    const slug = req.params.slug;

    const matchScore = await getMatchScoreBySlug(slug);

    if (!matchScore) {
      sendResponse<null>({
        res,
        statusCode: 404,
        message: "Match not found.",
        data: null,
      });

      return;
    }

    sendResponse<MatchScoreResponse>({
      res,
      message: "Match score fetched successfully.",
      data: matchScore,
    });
  },
);

export const getMatchCommentary = asyncHandler<MatchSlugParams>(
  async (req, res): Promise<void> => {
    const matchCommentary = await getMatchCommentaryBySlug(req.params.slug);

    if (!matchCommentary) {
      sendResponse<null>({
        res,
        statusCode: 404,
        message: "Match not found.",
        data: null,
      });

      return;
    }

    sendResponse<MatchCommentaryResponse>({
      res,
      message: "Match commentary fetched successfully.",
      data: matchCommentary,
    });
  },
);
