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
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    PORT: z.coerce.number().int().positive().max(65535).default(5000),

    CORS_ORIGIN: z.preprocess(
      normalizeCorsOrigin,
      z.union([z.literal("*"), z.array(z.string().url()).min(1)]).optional(),
    ),

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
const isTest = data.NODE_ENV === "test";

export const env = Object.freeze({
  ...data,

  LOG_LEVEL: data.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),

  isDevelopment,
  isProduction,
  isTest,
});

export type Env = typeof env;
