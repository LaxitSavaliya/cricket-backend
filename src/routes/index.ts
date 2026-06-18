import { Router } from "express";

import healthRoutes from "../modules/health/health.routes.js";
import v1Routes from "./v1.routes.js";

const router: Router = Router();

interface RouteModule {
  path: string;
  route: Router;
}

const moduleRoutes: RouteModule[] = [
  {
    path: "/",
    route: healthRoutes,
  },
  {
    path: "/api/v1",
    route: v1Routes,
  },
];

moduleRoutes.forEach((moduleRoute) => {
  router.use(moduleRoute.path, moduleRoute.route);
});

export default router;
