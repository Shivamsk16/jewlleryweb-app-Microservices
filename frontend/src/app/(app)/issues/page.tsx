"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatNumber, formatDate } from "@/lib/utils";
import { api, apiFetch } from "@/lib/api";

type Issue = {
  id: number;
  vendorId: number;
  vendor: { name: string };
  material: string;
  purity: string;
  issuedWeight: number;
  expectedReturn: string;
  issueDate: string;
  status: string;
  purpose?: string | null;
  receives: { netWeight: number; returnedMaterial: number }[];
};

export default function IssuesPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const list = useQuery<Issue[]>({
    queryKey: ["issues", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return api<Issue[]>(`/api/issues?${params}`);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("issue.title")}</h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Distribute raw material to vendors for production
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          {t("issue.newIssue")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{t("issue.register")}</CardTitle>
              <CardDescription>All material issue entries</CardDescription>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 w-40"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RETURNED">Returned</option>
              <option value="OVERDUE">Overdue</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Purity</TableHead>
                <TableHead className="text-right">Issued (g)</TableHead>
                <TableHead className="text-right">Pending (g)</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-textMuted">
                    {t("common.noData")}
                  </TableCell>
                </TableRow>
              )}
              {(list.data ?? []).map((i) => {
                const received = i.receives.reduce(
                  (s, r) => s + r.netWeight + r.returnedMaterial,
                  0,
                );
                const pending = +(i.issuedWeight - received).toFixed(3);
                const overdue = i.status === "OVERDUE";
                return (
                  <TableRow
                    key={i.id}
                    className={overdue ? "!bg-danger/10 hover:!bg-danger/15" : ""}
                  >
                    <TableCell className="text-xs">{formatDate(i.issueDate)}</TableCell>
                    <TableCell className="font-medium">{i.vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant={i.material === "GOLD" ? "gold" : "silver"}>
                        {i.material}
                      </Badge>
                    </TableCell>
                    <TableCell>{i.purity}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatNumber(i.issuedWeight)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(pending)}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(i.expectedReturn)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          overdue
                            ? "danger"
                            : i.status === "RETURNED"
                              ? "success"
                              : "default"
                        }
                        className={overdue ? "animate-pulse-danger" : ""}
                      >
                        {i.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IssueFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function IssueFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const vendors = useQuery<any[]>({
    queryKey: ["vendors-active"],
    queryFn: async () => {
      const all = await api<any[]>("/api/vendors");
      return all.filter((v: any) => v.isActive);
    },
    enabled: open,
  });

  const stock = useQuery<any[]>({
    queryKey: ["stock"],
    queryFn: () => api<any[]>("/api/materials/stock"),
    enabled: open,
  });

  const [vendorId, setVendorId] = React.useState<number | null>(null);
  const [material, setMaterial] = React.useState<"GOLD" | "SILVER">("GOLD");
  const [purity, setPurity] = React.useState("22K");
  const [issuedWeight, setIssuedWeight] = React.useState("");
  const [expectedReturn, setExpectedReturn] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [purpose, setPurpose] = React.useState("Making Order");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const available =
    (stock.data ?? []).find((s) => s.material === material && s.purity === purity)?.available ?? 0;
  const issued = Number(issuedWeight) || 0;
  const stockShort = issued > available;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!vendorId) {
      setError("Please select a vendor");
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch("/api/issues", {
        method: "POST",
        body: {
          vendorId,
          material,
          purity,
          issuedWeight: issued,
          expectedReturn,
          purpose,
          notes,
        },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.message ?? "Failed");
        return;
      }
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      onClose();
      setIssuedWeight("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("issue.newIssue")}</DialogTitle>
          <DialogDescription>Issue raw material to a vendor</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>{t("material.vendor")}</Label>
            <Select
              value={vendorId ?? ""}
              onChange={(e) => setVendorId(Number(e.target.value))}
              required
            >
              <option value="">Select vendor...</option>
              {(vendors.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.specialty ? `— ${v.specialty}` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("material.type")}</Label>
            <Select value={material} onChange={(e) => setMaterial(e.target.value as any)}>
              <option value="GOLD">{t("material.gold")}</option>
              <option value="SILVER">{t("material.silver")}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("material.purity")}</Label>
            <Select value={purity} onChange={(e) => setPurity(e.target.value)}>
              {(material === "GOLD" ? ["24K", "22K", "18K", "14K"] : ["999", "925"]).map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </Select>
          </div>

          <div className="space-y-1.5 col-span-2">
            <div className="rounded-md bg-brand-primaryLight border border-brand-primary/20 px-3 py-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-brand-primary">Available stock</span>
              <span className="tabular-nums font-bold text-brand-primary">
                {formatNumber(available)} g
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("material.issuedWeight")} ({t("weight.grams")})
            </Label>
            <Input
              type="number"
              step="0.001"
              value={issuedWeight}
              onChange={(e) => setIssuedWeight(e.target.value)}
              required
              className={stockShort ? "border-danger" : ""}
            />
            {stockShort && (
              <div className="flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="size-3" />
                Insufficient stock available
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("issue.expectedReturn")}</Label>
            <Input
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("issue.purpose")}</Label>
            <Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option>Making Order</option>
              <option>Sample</option>
              <option>Repair</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.notes")}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && (
            <div className="col-span-2 rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || stockShort}>
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
