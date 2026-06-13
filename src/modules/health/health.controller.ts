import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

export const getRootHandler: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Cricket backend API is running",
  });
};

export const getHealthHandler: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Service healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
};
