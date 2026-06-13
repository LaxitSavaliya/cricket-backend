import { Router } from "express";
import healthRoutes from "../modules/health/health.routes.js";

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
];

moduleRoutes.forEach((moduleRoute) => {
  router.use(moduleRoute.path, moduleRoute.route);
});

export default router;
