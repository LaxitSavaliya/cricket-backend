import { Router } from "express";

import { getMatch, getMatches } from "./match.controller.js";

const router = Router();

router.get("/", getMatches);
router.get("/:id", getMatch);

export default router;
