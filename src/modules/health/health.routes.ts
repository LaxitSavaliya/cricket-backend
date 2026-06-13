import { Router } from "express";
import { getHealthHandler, getRootHandler } from "./health.controller.js";

const router: Router = Router();

router.get("/", getRootHandler);
router.get("/health", getHealthHandler);

export default router;
