import type { Request, Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import type {
  MatchDetails,
  MatchListItem,
  MatchPlayersResponse,
} from "./match.service.js";
import {
  getAllMatches,
  getMatchById,
  getPlayersByMatchId,
} from "./match.service.js";

interface MatchIdParams {
  id: string;
}

export const getMatches = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const matches: MatchListItem[] = await getAllMatches();

    sendResponse<MatchListItem[]>({
      res,
      message: "Matches fetched successfully",
      data: matches,
    });
  },
);

export const getMatch = asyncHandler<MatchIdParams>(
  async (req, res): Promise<void> => {
    const { id } = req.params;
    const match: MatchDetails = await getMatchById(id);

    sendResponse<MatchDetails>({
      res,
      message: "Match fetched successfully",
      data: match,
    });
  },
);

export const getPlayers = asyncHandler<MatchIdParams>(
  async (req, res): Promise<void> => {
    const { id } = req.params;
    const players: MatchPlayersResponse = await getPlayersByMatchId(id);

    sendResponse<MatchPlayersResponse>({
      res,
      message: "Players fetched successfully",
      data: players,
    });
  },
);
