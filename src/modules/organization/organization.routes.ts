import { Router } from "express";

import { validateRequest } from "../../common/validateRequest.js";
import {
  requireAuth,
  requireOrganizationUser,
} from "../auth/auth.middleware.js";
import {
  createOrganization,
  getMyOrganization,
} from "./organization.controller.js";
import { createOrganizationBodySchema } from "./organization.schema.js";

const organizationRoutes: Router = Router();

organizationRoutes.get(
  "/onboarding-status",
  requireAuth,
  requireOrganizationUser,
  getMyOrganization,
);

organizationRoutes.post(
  "/create-organization",
  requireAuth,
  requireOrganizationUser,
  validateRequest({
    body: createOrganizationBodySchema,
  }),
  createOrganization,
);

export default organizationRoutes;
