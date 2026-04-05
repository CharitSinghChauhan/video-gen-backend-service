import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/api-response";
import { logger } from "../utils/logger";

export const errorMiddleware = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    const message = "Validation failed";

    logger.warn({ err, req }, "Validation error occurred");

    sendError(res, {
      message,
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: {
        formattedErrors,
        originalError: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        err: err,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, req }, "Application error occurred");

    sendError(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: {
        originalError: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        err: err,
      },
    });
    return;
  }

  logger.error({ err, req }, "Unexpected error occurred");

  return sendError(res, {
    message: err.message || "An unexpected error occurred",
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    details: {
      originalError: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      err,
    },
  });
};
