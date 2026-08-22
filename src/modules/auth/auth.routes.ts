import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";

import { checkSession, googleLogin, logout } from "./auth.controller.js";
import { requireAuth, requireUser } from "./auth.middleware.js";
import { googleLoginBodySchema } from "./auth.schema.js";

const authRoutes: Router = Router();

authRoutes.post(
  "/google",
  validateRequest({
    body: googleLoginBodySchema,
  }),
  googleLogin,
);

authRoutes.get("/session", requireAuth, requireUser, checkSession);

authRoutes.post("/logout", logout);

export default authRoutes;
