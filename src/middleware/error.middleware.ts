import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ErrorResponse } from "../types/common.types";

/**
 * Global error handling middleware
 * Should be the last middleware in the chain
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error occurred", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: "Internal Server Error",
    message: "An unexpected error occurred",
    statusCode: 500,
  };

  // Don't expose internal error details in production
  if (process.env["NODE_ENV"] === "development") {
    errorResponse.message = error.message;
  }

  res.status(500).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.warn("Route not found", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
  });
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
