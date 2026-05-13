import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { detectOverdue } from "../lib/business";

const receiveSchema = z.object({
  vendorId: z.string().uuid(),
  issueId: z.string().uuid(),
  itemName: z.string().min(1),
  grossWeight: z.number().nonnegative(),
  stoneWeight: z.number().nonnegative().default(0),
  returnedMaterial: z.number().nonnegative().default(0),
  qualityRemarks: z.string().optional().nullable(),
  receiveDate: z.string().optional(),
});

export async function list(req: Request, res: Response) {
  const { vendorId } = req.query as Record<string, string | undefined>;
  const where: any = {};
  if (vendorId) where.vendorId = vendorId;
  const items = await prisma.jewelleryReceive.findMany({
    where,
    include: { vendor: true, issue: true },
    orderBy: { receiveDate: "desc" },
  });
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const parsed = receiveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });
  }
  const d = parsed.data;

  const issue = await prisma.materialIssue.findUnique({
    where: { id: d.issueId },
    include: { receives: true },
  });
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  const netWeight = +(d.grossWeight - d.stoneWeight).toFixed(3);
  const wastage = +(
    (issue.issuedWeight - issue.receives.reduce((s, r) => s + r.netWeight + r.returnedMaterial, 0)) -
    netWeight -
    d.returnedMaterial
  ).toFixed(3);
  const wastagePercent = issue.issuedWeight > 0 ? +((wastage / issue.issuedWeight) * 100).toFixed(2) : 0;

  const created = await prisma.jewelleryReceive.create({
    data: {
      vendorId: d.vendorId,
      issueId: d.issueId,
      itemName: d.itemName,
      grossWeight: d.grossWeight,
      stoneWeight: d.stoneWeight,
      netWeight,
      wastage,
      wastagePercent,
      returnedMaterial: d.returnedMaterial,
      qualityRemarks: d.qualityRemarks || null,
      receiveDate: d.receiveDate ? new Date(d.receiveDate) : new Date(),
    },
  });

  const allReceives = await prisma.jewelleryReceive.findMany({ where: { issueId: d.issueId } });
  const totalReturned = allReceives.reduce((s, r) => s + r.netWeight + r.returnedMaterial, 0);
  if (totalReturned >= issue.issuedWeight * 0.99) {
    await prisma.materialIssue.update({
      where: { id: d.issueId },
      data: { status: "RETURNED" },
    });
  }

  await detectOverdue();
  res.status(201).json(created);
}

export async function detail(req: Request, res: Response) {
  const id = req.params.id;
  const item = await prisma.jewelleryReceive.findUnique({
    where: { id },
    include: { vendor: true, issue: true },
  });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
}
