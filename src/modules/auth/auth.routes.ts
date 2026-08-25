import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";

import {
  checkSession,
  logout,
  organizationGoogleLogin,
  playerGoogleLogin,
} from "./auth.controller.js";
import {
  requireAuth,
  requireOrganizationUser,
  requirePlayerUser,
} from "./auth.middleware.js";
import { googleLoginBodySchema } from "./auth.schema.js";

const authRoutes: Router = Router();

authRoutes.post(
  "/player/google",
  validateRequest({
    body: googleLoginBodySchema,
  }),
  playerGoogleLogin,
);

authRoutes.post(
  "/organization/google",
  validateRequest({
    body: googleLoginBodySchema,
  }),
  organizationGoogleLogin,
);

authRoutes.get("/player/session", requireAuth, requirePlayerUser, checkSession);

authRoutes.get(
  "/organization/session",
  requireAuth,
  requireOrganizationUser,
  checkSession,
);

authRoutes.post("/logout", logout);

export default authRoutes;
