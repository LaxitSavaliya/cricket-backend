import compression from "compression";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

const app: Application = express();

app.disable("x-powered-by");

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

const normalizeOrigin = (origin: string): string => {
  return origin.trim().replace(/\/+$/, "");
};

const allowedOrigins =
  Array.isArray(env.CORS_ORIGIN) && env.CORS_ORIGIN.length > 0
    ? env.CORS_ORIGIN.map(normalizeOrigin)
    : [];

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: (origin, callback): void => {
      /**
       * Allow requests with no origin:
       * - Postman
       * - curl
       * - server-to-server requests
       * - health checks
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      /**
       * Only allow wildcard CORS outside production.
       * Your env.ts already blocks "*" in production.
       */
      if (env.CORS_ORIGIN === "*" && !env.isProduction) {
        callback(null, true);
        return;
      }

      /**
       * In development, allow all browser origins if CORS_ORIGIN is not set.
       * In production, env.ts forces exact CORS_ORIGIN.
       */
      if (!env.CORS_ORIGIN && env.isDevelopment) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(ApiError.forbidden("CORS origin not allowed"));
    },

    credentials: env.CORS_ORIGIN !== "*",

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    maxAge: 86_400,
  }),
);

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
    handler: (_req, _res, next) => {
      next(
        ApiError.tooManyRequests("Too many requests. Please try again later."),
      );
    },
  }),
);

app.use(compression());

app.use(
  morgan(env.isProduction ? "combined" : "dev", {
    skip: (req) => req.path === "/health",
  }),
);

app.use(
  express.json({
    limit: env.REQUEST_BODY_LIMIT,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: env.REQUEST_BODY_LIMIT,
  }),
);

app.get("/", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Cricket backend API is running",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Service healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

/**
 * TODO:
 * Add API routes here later.
 *
 * Example:
 * app.use("/api/v1/matches", matchRoutes);
 */

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;
