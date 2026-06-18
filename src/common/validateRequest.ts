import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";

import ApiError from "../utils/ApiError.js";

type RequestPart = "body" | "params" | "query";

type ValidateRequestOptions = Partial<Record<RequestPart, ZodType<unknown>>>;

const formatZodError = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";

      return `${path}: ${issue.message}`;
    })
    .join(", ");
};

export const validateRequest = (
  schemas: ValidateRequestOptions,
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest(formatZodError(error)));
        return;
      }

      next(error);
    }
  };
};
