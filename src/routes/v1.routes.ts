import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import matchRoutes from "../modules/match/match.routes.js";
import playerRoutes from "../modules/player/player.routes.js";

const router: Router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Cricket API v1 is running",
  });
});

router.use("/matches", matchRoutes);
router.use("/auth", authRoutes);
router.use("/players", playerRoutes);

export default router;
