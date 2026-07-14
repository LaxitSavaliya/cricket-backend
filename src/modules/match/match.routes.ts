import { Router } from "express";

import { getMatch, getMatches, getMatchPlayers } from "./match.controller.js";

const matchRouter: Router = Router();

matchRouter.get("/", getMatches);
matchRouter.get("/:slug", getMatch);
matchRouter.get("/:slug/players", getMatchPlayers);

export default matchRouter;
