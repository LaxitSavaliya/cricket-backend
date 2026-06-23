import { Router } from "express";

import { getMatch, getMatches, getPlayers } from "./match.controller.js";

const matchRouter: Router = Router();

matchRouter.get("/", getMatches);
matchRouter.get("/:id", getMatch);
matchRouter.get("/:id/players", getPlayers);

export default matchRouter;
