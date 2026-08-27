import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";
import { requireAuth, requirePlayerUser } from "../auth/auth.middleware.js";
import { createPlayer, getMyPlayer } from "./player.controller.js";
import { createPlayerBodySchema } from "./player.schema.js";

const playerRoutes: Router = Router();

playerRoutes.get(
  "/onboarding-status",
  requireAuth,
  requirePlayerUser,
  getMyPlayer,
);

playerRoutes.post(
  "/create-player",
  requireAuth,
  requirePlayerUser,
  validateRequest({
    body: createPlayerBodySchema,
  }),
  createPlayer,
);

export default playerRoutes;
