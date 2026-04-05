import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "../config/env";

// Create the main logger instance
export const logger = pino({
  level: env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

// HTTP logging middleware
export const httpLogger = pinoHttp({
  logger,
  // Customize request logging
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    }
    if (res.statusCode >= 500 || err) {
      return "error";
    }
    return "info";
  },
  // Customize success/error messages
  customSuccessMessage: (req, res) => {
    return `Request completed: ${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    return `Request failed: ${req.method} ${req.url}`;
  },
  // Customize received message
  customReceivedMessage: (req) => {
    return `Request received: ${req.method} ${req.url}`;
  },
  // Serialize request and response
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers,
    }),
  },
  // Redact sensitive data
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
    ],
    censor: "[REDACTED]",
  },
});
