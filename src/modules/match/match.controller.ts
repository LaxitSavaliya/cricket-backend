import type { Request, Response } from "express";

import { asyncHandler } from "../../common/asyncHandler.js";
import { sendResponse } from "../../common/sendResponse.js";
import { getAllMatches } from "./match.service.js";

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
