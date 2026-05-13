import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { computeStock, computeVendorBalances } from "../lib/business";

export async function stock(_req: Request, res: Response) {
  const data = await computeStock();
  res.json(data);
}

export async function vendorPending(_req: Request, res: Response) {
  const balances = await computeVendorBalances();
  res.json(balances.sort((a, b) => b.pending - a.pending));
}

export async function production(_req: Request, res: Response) {
  const receives = await prisma.jewelleryReceive.findMany({
    include: { vendor: true, issue: true },
    orderBy: { receiveDate: "desc" },
  });

  const byMonth = new Map<string, { month: string; netWeight: number; count: number; wastage: number }>();
  for (const r of receives) {
    const d = new Date(r.receiveDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key))
      byMonth.set(key, { month: key, netWeight: 0, count: 0, wastage: 0 });
    const entry = byMonth.get(key)!;
    entry.netWeight += r.netWeight;
    entry.wastage += r.wastage;
    entry.count += 1;
  }

  const byItem = new Map<string, { itemName: string; count: number; netWeight: number }>();
  for (const r of receives) {
    if (!byItem.has(r.itemName))
      byItem.set(r.itemName, { itemName: r.itemName, count: 0, netWeight: 0 });
    const entry = byItem.get(r.itemName)!;
    entry.count += 1;
    entry.netWeight += r.netWeight;
  }

  res.json({
    monthly: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
    byItem: Array.from(byItem.values()).sort((a, b) => b.netWeight - a.netWeight),
    items: receives,
  });
}

export async function wastage(_req: Request, res: Response) {
  const receives = await prisma.jewelleryReceive.findMany({
    include: { vendor: true, issue: true },
    orderBy: { receiveDate: "desc" },
  });
  const avg =
    receives.length > 0
      ? receives.reduce((s, r) => s + r.wastagePercent, 0) / receives.length
      : 0;
  res.json({
    average: +avg.toFixed(2),
    items: receives.map((r) => ({
      id: r.id,
      vendor: r.vendor.name,
      itemName: r.itemName,
      issuedWeight: r.issue.issuedWeight,
      netWeight: r.netWeight,
      wastage: r.wastage,
      wastagePercent: r.wastagePercent,
      receiveDate: r.receiveDate,
    })),
  });
}
