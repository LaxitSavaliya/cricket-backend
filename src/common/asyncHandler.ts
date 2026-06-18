import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

type AsyncController<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  next: NextFunction,
) => unknown | Promise<unknown>;

export const asyncHandler = <
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
  Locals extends Record<string, unknown> = Record<string, unknown>,
>(
  fn: AsyncController<P, ResBody, ReqBody, ReqQuery, Locals>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> => {
  return (req, res, next): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
};
