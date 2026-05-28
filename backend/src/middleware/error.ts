import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "validation_error", details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  logger.error({ err }, "unhandled_error");
  res.status(500).json({ error: "internal_error" });
};
