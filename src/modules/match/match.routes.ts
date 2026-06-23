import { Router } from "express";

import {
  getMatch,
  getMatches,
  getPlayers,
  getScore,
} from "./match.controller.js";

const matchRouter: Router = Router();

matchRouter.get("/", getMatches);
matchRouter.get("/:id", getMatch);
matchRouter.get("/:id/players", getPlayers);
matchRouter.get("/:id/score", getScore);

export default matchRouter;
