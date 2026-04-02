import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, UnprocessableError } from "../utils/app-error";
import { sendError } from "../utils/api-response";

export const errorMiddleware = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = (res.locals.requestId as string) || "unknown";

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    const message = "Validation failed";

    sendError(res, {
      message,
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: {
        errors: formattedErrors,
        issues: err.issues,
      },
    });

    return;
  }

  if (err instanceof AppError) {
    sendError(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
    return;
  }

  console.error("Unexpected error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId,
  });

  return sendError(res, {
    message: err.message || "An unexpected error occurred",
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    details: {
      originalError: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    },
  });
};
