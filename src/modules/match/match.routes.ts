import { Router } from "express";

import {
  getMatch,
  getMatchCommentary,
  getMatches,
  getMatchPlayers,
  getMatchScore,
} from "./match.controller.js";

const matchRouter: Router = Router();

matchRouter.get("/", getMatches);
matchRouter.get("/:slug", getMatch);
matchRouter.get("/:slug/players", getMatchPlayers);
matchRouter.get("/:slug/score", getMatchScore);
matchRouter.get("/:slug/commentary", getMatchCommentary);

export default matchRouter;
