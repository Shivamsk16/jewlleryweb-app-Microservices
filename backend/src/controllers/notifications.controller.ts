import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { detectOverdue } from "../lib/business";

export async function list(_req: Request, res: Response) {
  await detectOverdue();
  const items = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(items);
}

export async function unreadCount(_req: Request, res: Response) {
  await detectOverdue();
  const count = await prisma.notification.count({ where: { isRead: false } });
  res.json({ count });
}

export async function markRead(req: Request, res: Response) {
  const id = req.params.id;
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  res.json({ ok: true });
}
