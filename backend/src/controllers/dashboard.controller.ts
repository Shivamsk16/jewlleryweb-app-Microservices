import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { computeStock, computeVendorBalances, detectOverdue } from "../lib/business";

export async function summary(_req: Request, res: Response) {
  await detectOverdue();

  const stock = await computeStock();
  const goldStock = stock
    .filter((s) => s.material === "GOLD")
    .reduce((sum, s) => sum + s.available, 0);
  const silverStock = stock
    .filter((s) => s.material === "SILVER")
    .reduce((sum, s) => sum + s.available, 0);

  const vendorBalances = await computeVendorBalances();
  const totalPending = vendorBalances
    .filter((v) => v.pending > 0)
    .reduce((s, v) => s + v.pending, 0);

  const totalProduced =
    (await prisma.jewelleryReceive.aggregate({ _sum: { netWeight: true } }))._sum.netWeight ?? 0;
  const overdueCount = await prisma.materialIssue.count({ where: { status: "OVERDUE" } });

  res.json({
    goldStock: +goldStock.toFixed(3),
    silverStock: +silverStock.toFixed(3),
    totalPending: +totalPending.toFixed(3),
    totalProduced: +totalProduced.toFixed(3),
    overdueCount,
    stock,
    vendorBalances,
    lastUpdated: new Date().toISOString(),
  });
}

export async function trends(_req: Request, res: Response) {
  const months: { month: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", { month: "short" }),
    });
  }

  const [purchases, issues, receives] = await Promise.all([
    prisma.rawMaterialPurchase.findMany({ where: { isDeleted: false } }),
    prisma.materialIssue.findMany(),
    prisma.jewelleryReceive.findMany(),
  ]);

  const trend = months.map((m) => {
    const purchased = purchases
      .filter((p) => p.purchaseDate.toISOString().slice(0, 7) === m.month)
      .reduce((s, p) => s + p.netWeight, 0);
    const issued = issues
      .filter((i) => i.issueDate.toISOString().slice(0, 7) === m.month)
      .reduce((s, i) => s + i.issuedWeight, 0);
    const received = receives
      .filter((r) => r.receiveDate.toISOString().slice(0, 7) === m.month)
      .reduce((s, r) => s + r.netWeight, 0);
    return {
      month: m.label,
      purchased: +purchased.toFixed(3),
      issued: +issued.toFixed(3),
      received: +received.toFixed(3),
    };
  });

  res.json(trend);
}

export async function recent(_req: Request, res: Response) {
  const [purchases, issues, receives] = await Promise.all([
    prisma.rawMaterialPurchase.findMany({
      where: { isDeleted: false },
      orderBy: { purchaseDate: "desc" },
      take: 10,
    }),
    prisma.materialIssue.findMany({
      orderBy: { issueDate: "desc" },
      take: 10,
      include: { vendor: true },
    }),
    prisma.jewelleryReceive.findMany({
      orderBy: { receiveDate: "desc" },
      take: 10,
      include: { vendor: true },
    }),
  ]);

  const activities = [
    ...purchases.map((p) => ({
      id: `p-${p.id}`,
      type: "PURCHASE" as const,
      title: `Purchase: ${p.material} ${p.purity}`,
      description: `${p.grossWeight.toFixed(3)}g from ${p.vendorName ?? "—"}`,
      date: p.purchaseDate.toISOString(),
      link: `/materials`,
    })),
    ...issues.map((i) => ({
      id: `i-${i.id}`,
      type: "ISSUE" as const,
      title: `Issued: ${i.material} ${i.purity}`,
      description: `${i.issuedWeight.toFixed(3)}g to ${i.vendor.name}`,
      date: i.issueDate.toISOString(),
      link: `/issues`,
    })),
    ...receives.map((r) => ({
      id: `r-${r.id}`,
      type: "RECEIVE" as const,
      title: `Received: ${r.itemName}`,
      description: `${r.netWeight.toFixed(3)}g net from ${r.vendor.name}`,
      date: r.receiveDate.toISOString(),
      link: `/receives`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  res.json(activities);
}
