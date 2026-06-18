import { Prisma } from "../generated/prisma/client.js";

import ApiError from "../utils/ApiError.js";

const DEFAULT_UNIQUE_FIELD = "Field";

const formatFieldName = (field: string): string => {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const getPrismaTarget = (target: unknown): string => {
  if (
    Array.isArray(target) &&
    target.every((item) => typeof item === "string")
  ) {
    return target.map(formatFieldName).join(", ");
  }

  if (typeof target === "string") {
    return formatFieldName(target);
  }

  return DEFAULT_UNIQUE_FIELD.toLowerCase();
};

export const handlePrismaError = (error: unknown): ApiError | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = getPrismaTarget(error.meta?.["target"]);

    switch (error.code) {
      case "P2000":
        return ApiError.badRequest("Provided value is too long");

      case "P2002":
        return ApiError.conflict(`${target} already exists`);

      case "P2003":
        return ApiError.badRequest("Invalid related record reference");

      case "P2011":
        return ApiError.badRequest("Required field is missing");

      case "P2014":
        return ApiError.badRequest("Invalid relation change");

      case "P2025":
        return ApiError.notFound("Record not found");

      default:
        return ApiError.badRequest("Database request failed");
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest("Invalid database query data");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ApiError.internal("Database connection failed", error);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return ApiError.internal("Database engine error", error);
  }

  return null;
};
