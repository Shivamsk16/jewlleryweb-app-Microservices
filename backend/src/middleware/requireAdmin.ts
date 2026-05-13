import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./requireAuth";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, (err?: any) => {
    if (err) return next(err);
    if (!req.user) return; // requireAuth already responded
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden — admin only" });
    }
    next();
  });
}
