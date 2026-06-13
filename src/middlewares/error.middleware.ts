import { type ErrorRequestHandler, type RequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import ApiError, { type ApiErrorDetails } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

type ErrorResponse = {
  success: false;
  message: string;
  errors?: ApiErrorDetails;
  stack?: string;
};

type HttpLikeError = Error & {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  type?: string;
  body?: unknown;
  limit?: number;
  length?: number;
  expected?: number;
  received?: number;
};

const appendValidationError = (
  errors: Record<string, string[]>,
  field: string,
  message: string,
): void => {
  errors[field] ??= [];
  errors[field].push(message);
};

const formatZodErrors = (error: ZodError): ApiErrorDetails => {
  const validationErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        appendValidationError(validationErrors, key, `${key} is not allowed`);
      }

      continue;
    }

    const field = issue.path.length > 0 ? issue.path.join(".") : "root";

    appendValidationError(validationErrors, field, issue.message);
  }

  return validationErrors;
};

const isHttpLikeError = (error: unknown): error is HttpLikeError => {
  return error instanceof Error;
};

const getHttpStatusCode = (error: HttpLikeError): number | null => {
  const statusCode = error.statusCode ?? error.status;

  if (
    typeof statusCode === "number" &&
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode <= 599
  ) {
    return statusCode;
  }

  return null;
};

const isInvalidJsonError = (error: unknown): error is HttpLikeError => {
  return (
    isHttpLikeError(error) &&
    error instanceof SyntaxError &&
    (error.type === "entity.parse.failed" || "body" in error)
  );
};

const isPayloadTooLargeError = (error: unknown): error is HttpLikeError => {
  return (
    isHttpLikeError(error) &&
    (error.type === "entity.too.large" ||
      error.status === 413 ||
      error.statusCode === 413)
  );
};

const shouldLogError = (statusCode: number): boolean => {
  if (statusCode >= 500) {
    return true;
  }

  return !env.isProduction;
};

const logError = (error: unknown, statusCode: number): void => {
  if (!shouldLogError(statusCode)) {
    return;
  }

  if (error instanceof Error) {
    logger.error(error, `[Error] ${error.name}: ${error.message}`);
    return;
  }

  logger.error({ error }, "[Error] Non-Error value thrown");
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = 500;
  let message = "Internal server error";
  let errors: ApiErrorDetails | null = null;
  let stack: string | undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message =
      env.isProduction && (statusCode >= 500 || !error.isOperational)
        ? "Internal server error"
        : error.message;
    errors = error.errors;
    stack = error.stack;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = formatZodErrors(error);
    stack = error.stack;
  } else if (isInvalidJsonError(error)) {
    statusCode = 400;
    message = "Invalid JSON payload";
    stack = error.stack;
  } else if (isPayloadTooLargeError(error)) {
    statusCode = 413;
    message = "Request payload too large";
    errors = {
      limit: error.limit,
      length: error.length,
      expected: error.expected,
      received: error.received,
    };
    stack = error.stack;
  } else if (isHttpLikeError(error)) {
    const httpStatusCode = getHttpStatusCode(error);

    statusCode = httpStatusCode ?? 500;
    message =
      env.isProduction && statusCode >= 500
        ? "Internal server error"
        : error.message || message;
    stack = error.stack;
  }

  logError(error, statusCode);

  const response: ErrorResponse = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(!env.isProduction && stack ? { stack } : {}),
  };

  res.status(statusCode).json(response);
};
