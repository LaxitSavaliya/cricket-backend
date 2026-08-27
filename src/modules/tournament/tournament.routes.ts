import { Router } from "express";

import {
  requireAuth,
  requireOrganizationUser,
  requireOrganizationUserOnboarded,
} from "../auth/auth.middleware.js";
import { getTournaments } from "./tournament.controller.js";

const tournamentRoutes: Router = Router();

tournamentRoutes.get(
  "/",
  requireAuth,
  requireOrganizationUser,
  requireOrganizationUserOnboarded,
  getTournaments,
);

export default tournamentRoutes;
