import type { Response } from "express";

type ApiSuccessResponse<TData = unknown, TMeta = unknown> = {
  success: true;
  message: string;
  data?: TData;
  meta?: TMeta;
};

type SendResponseOptions<TData = unknown, TMeta = unknown> = {
  res: Response<ApiSuccessResponse<TData, TMeta>>;
  statusCode?: number;
  message: string;
  data?: TData;
  meta?: TMeta;
};

export const sendResponse = <TData = unknown, TMeta = unknown>({
  res,
  statusCode = 200,
  message,
  data,
  meta,
}: SendResponseOptions<TData, TMeta>): Response<
  ApiSuccessResponse<TData, TMeta>
> => {
  const responseBody: ApiSuccessResponse<TData, TMeta> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(responseBody);
};
