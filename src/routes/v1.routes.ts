import { Router } from "express";

import matchRoutes from "../modules/match/match.routes.js";

const router: Router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Cricket API v1 is running",
  });
});

router.use("/matches", matchRoutes);

export default router;
