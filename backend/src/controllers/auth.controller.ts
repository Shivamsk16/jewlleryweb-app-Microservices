import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  clearAuthCookie,
  getTokenFromRequest,
  setAuthCookie,
  signToken,
  verifyPassword,
  verifyToken,
} from "../lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "USER",
  });
  setAuthCookie(res, token);

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    // also return the token for non-browser clients (mobile, scripts).
    token,
  });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const token = getTokenFromRequest(req);
  if (!token) return res.json({ user: null });
  const user = verifyToken(token);
  return res.json({ user });
}
