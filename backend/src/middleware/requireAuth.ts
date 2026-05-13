import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken, type JWTPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }
  req.user = user;
  next();
}
