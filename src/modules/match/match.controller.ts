import type { Request, Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import { getAllMatches, getMatchById } from "./match.service.js";

export const getMatches = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const matches = await getAllMatches();

    sendResponse({
      res,
      message: "Matches fetched successfully",
      data: matches,
    });
  },
);

export const getMatch = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const match = await getMatchById(id);

    sendResponse({
      res,
      message: "Match fetched successfully",
      data: match,
    });
  },
);
