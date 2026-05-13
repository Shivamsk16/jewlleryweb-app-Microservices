import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("[error]", err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    message: err?.message ?? "Server error",
  });
}
