import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";

import { getMe, googleLogin, logout } from "./auth.controller.js";
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

authRoutes.get("/me", requireAuth, requireUser, getMe);

authRoutes.post("/logout", logout);

export default authRoutes;
