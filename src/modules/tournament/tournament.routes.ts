import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";
import {
  requireAuth,
  requireOrganizationUser,
  requireOrganizationUserOnboarded,
} from "../auth/auth.middleware.js";
import { createTournament, getTournaments } from "./tournament.controller.js";
import { createTournamentBodySchema } from "./tournament.schema.js";

const tournamentRoutes: Router = Router();

tournamentRoutes.get(
  "/",
  requireAuth,
  requireOrganizationUser,
  requireOrganizationUserOnboarded,
  getTournaments,
);

tournamentRoutes.post(
  "/",
  requireAuth,
  requireOrganizationUser,
  requireOrganizationUserOnboarded,
  validateRequest({
    body: createTournamentBodySchema,
  }),
  createTournament,
);

export default tournamentRoutes;
