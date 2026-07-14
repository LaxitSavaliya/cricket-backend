import type { Response } from "express";

type ApiResponse<TData = unknown, TMeta = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  meta?: TMeta;
};

type SendResponseOptions<TData = unknown, TMeta = unknown> = {
  res: Response<ApiResponse<TData, TMeta>>;
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
}: SendResponseOptions<TData, TMeta>): Response<ApiResponse<TData, TMeta>> => {
  const success = statusCode >= 200 && statusCode < 300;

  const responseBody: ApiResponse<TData, TMeta> = {
    success,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(responseBody);
};
