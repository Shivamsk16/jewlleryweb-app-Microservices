import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { computeVendorBalances } from "../lib/business";

const vendorSchema = z.object({
  name: z.string().min(1),
  nameHi: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^[+0-9 ()-]{7,15}$/.test(v),
      "Phone format invalid",
    ),
  address: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function list(_req: Request, res: Response) {
  const items = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });
  }
  const created = await prisma.vendor.create({ data: parsed.data });
  res.status(201).json(created);
}

export async function detail(req: Request, res: Response) {
  const id = req.params.id;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      issues: {
        orderBy: { issueDate: "desc" },
        include: { receives: true },
      },
      receives: { orderBy: { receiveDate: "desc" } },
    },
  });
  if (!vendor) return res.status(404).json({ message: "Not found" });
  res.json(vendor);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id;
  const updated = await prisma.vendor.update({ where: { id }, data: req.body ?? {} });
  res.json(updated);
}

export async function balance(req: Request, res: Response) {
  const id = req.params.id;
  const balances = await computeVendorBalances();
  const found = balances.find((b) => b.vendorId === id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
}
