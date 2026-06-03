import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[api] unhandled error:", err);

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : undefined,
  });
}
