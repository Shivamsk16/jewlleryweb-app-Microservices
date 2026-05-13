import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { detectOverdue, getAvailableStock } from "../lib/business";

const issueSchema = z.object({
  vendorId: z.string().uuid(),
  material: z.enum(["GOLD", "SILVER"]),
  purity: z.string(),
  issuedWeight: z.number().positive(),
  expectedReturn: z.string(),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function list(req: Request, res: Response) {
  await detectOverdue();
  const { status, vendorId } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (vendorId) where.vendorId = vendorId;

  const items = await prisma.materialIssue.findMany({
    where,
    include: { vendor: true, receives: true },
    orderBy: { issueDate: "desc" },
  });
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const parsed = issueSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });
  }
  const d = parsed.data;

  const available = await getAvailableStock(d.material, d.purity);
  if (d.issuedWeight > available) {
    return res
      .status(400)
      .json({ message: `Insufficient stock. Available: ${available.toFixed(3)}g` });
  }

  const created = await prisma.materialIssue.create({
    data: {
      vendorId: d.vendorId,
      material: d.material,
      purity: d.purity,
      issuedWeight: d.issuedWeight,
      expectedReturn: new Date(d.expectedReturn),
      purpose: d.purpose || null,
      notes: d.notes || null,
    },
  });
  res.status(201).json(created);
}

export async function detail(req: Request, res: Response) {
  const id = req.params.id;
  const issue = await prisma.materialIssue.findUnique({
    where: { id },
    include: { vendor: true, receives: true },
  });
  if (!issue) return res.status(404).json({ message: "Not found" });
  res.json(issue);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id;
  const body = req.body ?? {};
  const data: any = {};
  if (body.expectedReturn) data.expectedReturn = new Date(body.expectedReturn);
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  const updated = await prisma.materialIssue.update({ where: { id }, data });
  res.json(updated);
}

export async function overdue(_req: Request, res: Response) {
  await detectOverdue();
  const items = await prisma.materialIssue.findMany({
    where: { status: "OVERDUE" },
    include: { vendor: true, receives: true },
    orderBy: { expectedReturn: "asc" },
  });
  res.json(items);
}
