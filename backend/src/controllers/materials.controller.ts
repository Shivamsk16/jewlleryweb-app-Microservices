import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { computeStock } from "../lib/business";
import { purityToFraction } from "../lib/utils";

const purchaseSchema = z.object({
  material: z.enum(["GOLD", "SILVER"]),
  purity: z.string(),
  grossWeight: z.number().positive(),
  ratePerGram: z.number().nonnegative(),
  vendorName: z.string().optional().nullable(),
  invoiceNo: z.string().optional().nullable(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function list(req: Request, res: Response) {
  const { material, search, from, to } = req.query as Record<string, string | undefined>;

  const where: any = { isDeleted: false };
  if (material && material !== "ALL") where.material = material;
  if (search) {
    // mode: "insensitive" preserves the case-insensitive search behavior we
    // had on SQLite. Postgres `contains` is case-sensitive by default.
    where.OR = [
      { vendorName: { contains: search, mode: "insensitive" } },
      { invoiceNo: { contains: search, mode: "insensitive" } },
    ];
  }
  if (from || to) {
    where.purchaseDate = {};
    if (from) where.purchaseDate.gte = new Date(from);
    if (to) where.purchaseDate.lte = new Date(to);
  }

  const items = await prisma.rawMaterialPurchase.findMany({
    where,
    orderBy: { purchaseDate: "desc" },
  });
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });
  }
  const d = parsed.data;
  const fraction = purityToFraction(d.purity);
  const netWeight = +(d.grossWeight * fraction).toFixed(3);
  const totalAmount = +(d.grossWeight * d.ratePerGram).toFixed(2);

  const created = await prisma.rawMaterialPurchase.create({
    data: {
      material: d.material,
      purity: d.purity,
      grossWeight: d.grossWeight,
      netWeight,
      ratePerGram: d.ratePerGram,
      totalAmount,
      vendorName: d.vendorName || null,
      invoiceNo: d.invoiceNo || null,
      purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : new Date(),
      notes: d.notes || null,
    },
  });
  res.status(201).json(created);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id;
  const body = req.body ?? {};
  const data: any = {};
  if (body.material) data.material = body.material;
  if (body.purity) data.purity = body.purity;
  if (body.grossWeight !== undefined) data.grossWeight = body.grossWeight;
  if (body.ratePerGram !== undefined) data.ratePerGram = body.ratePerGram;
  if (body.purchaseDate) data.purchaseDate = new Date(body.purchaseDate);
  if (body.vendorName !== undefined) data.vendorName = body.vendorName;
  if (body.invoiceNo !== undefined) data.invoiceNo = body.invoiceNo;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.grossWeight !== undefined && body.purity) {
    data.netWeight = +(body.grossWeight * purityToFraction(body.purity)).toFixed(3);
  }
  if (body.grossWeight !== undefined && body.ratePerGram !== undefined) {
    data.totalAmount = +(body.grossWeight * body.ratePerGram).toFixed(2);
  }
  const updated = await prisma.rawMaterialPurchase.update({ where: { id }, data });
  res.json(updated);
}

export async function softDelete(req: Request, res: Response) {
  const id = req.params.id;
  await prisma.rawMaterialPurchase.update({
    where: { id },
    data: { isDeleted: true },
  });
  res.json({ ok: true });
}

export async function stock(_req: Request, res: Response) {
  const data = await computeStock();
  res.json(data);
}
