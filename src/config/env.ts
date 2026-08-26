import "dotenv/config";

import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const normalizeCorsOrigin = (value: unknown): unknown => {
  const sanitized = emptyStringToUndefined(value);

  if (typeof sanitized !== "string") {
    return sanitized;
  }

  const trimmed = sanitized.trim();

  if (trimmed === "*") {
    return "*";
  }

  return trimmed
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
};

const booleanFromString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return value;
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),

    PORT: z.coerce.number().int().positive().max(65535).default(5000),

    CORS_ORIGIN: z.preprocess(
      normalizeCorsOrigin,
      z.union([z.literal("*"), z.array(z.string().url()).min(1)]).optional(),
    ),

    GOOGLE_CLIENT_ID: z
      .string()
      .trim()
      .min(1, "GOOGLE_CLIENT_ID is required")
      .refine((value) => value.endsWith(".apps.googleusercontent.com"), {
        message: "GOOGLE_CLIENT_ID must be a valid Google OAuth client ID",
      }),

    JWT_SECRET: z
      .string()
      .trim()
      .min(32, "JWT_SECRET must be at least 32 characters"),

    AUTH_COOKIE_NAME: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().default("cricket_session"),
    ),

    AUTH_SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60),

    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional(),

    REQUEST_BODY_LIMIT: z
      .string()
      .trim()
      .regex(/^\d+(b|kb|mb)$/i, "Must be a valid size like 500kb, 1mb, or 2mb")
      .default("2mb"),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),

    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),

    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

    HEADERS_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),

    KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),

    DATABASE_URL: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .url("DATABASE_URL must be a valid URL")
        .refine(
          (url) =>
            url.startsWith("postgresql://") || url.startsWith("postgres://"),
          "DATABASE_URL must be a PostgreSQL connection string",
        )
        .optional(),
    ),

    TRUST_PROXY: z.preprocess(booleanFromString, z.boolean().default(false)),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      if (!env.CORS_ORIGIN || env.CORS_ORIGIN === "*") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message:
            "Exact frontend origin is required in production. Do not use '*'.",
        });
      }

      if (!env.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL is required in production.",
        });
      }
    }

    if (env.HEADERS_TIMEOUT_MS > env.REQUEST_TIMEOUT_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["HEADERS_TIMEOUT_MS"],
        message:
          "HEADERS_TIMEOUT_MS should be less than or equal to REQUEST_TIMEOUT_MS.",
      });
    }

    if (env.KEEP_ALIVE_TIMEOUT_MS >= env.HEADERS_TIMEOUT_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["KEEP_ALIVE_TIMEOUT_MS"],
        message:
          "KEEP_ALIVE_TIMEOUT_MS should be less than HEADERS_TIMEOUT_MS.",
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables configuration:");

  const { fieldErrors, formErrors } = parsedEnv.error.flatten();

  for (const error of formErrors) {
    console.error(`- ${error}`);
  }

  for (const [key, errors] of Object.entries(fieldErrors)) {
    if (errors?.length) {
      console.error(`- ${key}: ${errors.join(", ")}`);
    }
  }

  process.exit(1);
}

const data = parsedEnv.data;

const isDevelopment = data.NODE_ENV === "development";
const isProduction = data.NODE_ENV === "production";

export const env = Object.freeze({
  ...data,

  LOG_LEVEL: data.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),

  isDevelopment,
  isProduction,
});

export type Env = typeof env;
