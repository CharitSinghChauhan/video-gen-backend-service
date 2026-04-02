import type { Response } from "express";
import { env } from "../config/env";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
  requestId: string;
  timestamp: string;
  error?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: {
    message?: string;
    statusCode?: number;
    meta?: ApiMeta;
    error?: unknown;
  } = {},
): void {
  const { message = "Success", statusCode = 200, meta, error } = options;

  const body: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    requestId: res.locals.requestId as string,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
    error,
  };

  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  options: {
    message?: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
  } = {},
): void {
  const {
    message = "An unexpected error occurred",
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details,
  } = options;

  const isDev = env.NODE_ENV === "development";

  let body;

  if (isDev) {
    body = {
      message,
      success: false,
      code,
    };
  } else {
    body = {
      success: false,
      message,
      code,
      details,
    };
  }

  res.status(statusCode).json(body);
}
