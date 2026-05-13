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

type Receive = {
  id: string;
  vendor: { name: string };
  issue: { material: string; purity: string; issuedWeight: number };
  itemName: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  wastage: number;
  wastagePercent: number;
  returnedMaterial: number;
  receiveDate: string;
  qualityRemarks?: string | null;
};

export default function ReceivesPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = React.useState(false);

  const list = useQuery<Receive[]>({
    queryKey: ["receives"],
    queryFn: () => api<Receive[]>("/api/receives"),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("receive.title")}
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Record finished jewellery received from vendors
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          {t("receive.newReceive")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("receive.register")}</CardTitle>
          <CardDescription>Auto-calculated wastage and net weight</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Gross (g)</TableHead>
                <TableHead className="text-right">Stone (g)</TableHead>
                <TableHead className="text-right">Net (g)</TableHead>
                <TableHead className="text-right">Returned (g)</TableHead>
                <TableHead className="text-right">Wastage</TableHead>
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
              {(list.data ?? []).map((r) => (
                <TableRow key={r.id} className={r.wastagePercent > 10 ? "!bg-danger/5" : ""}>
                  <TableCell className="text-xs">{formatDate(r.receiveDate)}</TableCell>
                  <TableCell className="font-medium">{r.vendor.name}</TableCell>
                  <TableCell>{r.itemName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.grossWeight)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.stoneWeight)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatNumber(r.netWeight)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.returnedMaterial)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums font-semibold ${
                      r.wastagePercent > 10 ? "text-danger" : "text-textPrimary"
                    }`}
                  >
                    {formatNumber(r.wastage)} ({r.wastagePercent.toFixed(2)}%)
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReceiveFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function ReceiveFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const issues = useQuery<any[]>({
    queryKey: ["pending-issues"],
    queryFn: async () => {
      const all = await api<any[]>("/api/issues");
      return all.filter((i: any) => i.status !== "RETURNED");
    },
    enabled: open,
  });

  const [issueId, setIssueId] = React.useState<string | null>(null);
  const [itemName, setItemName] = React.useState("");
  const [grossWeight, setGrossWeight] = React.useState("");
  const [stoneWeight, setStoneWeight] = React.useState("0");
  const [returnedMaterial, setReturnedMaterial] = React.useState("0");
  const [qualityRemarks, setQualityRemarks] = React.useState("");
  const [receiveDate, setReceiveDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const issue = (issues.data ?? []).find((i) => i.id === issueId);
  const gross = Number(grossWeight) || 0;
  const stone = Number(stoneWeight) || 0;
  const ret = Number(returnedMaterial) || 0;
  const netWeight = +(gross - stone).toFixed(3);

  const receivedSoFar = issue
    ? issue.receives.reduce((s: number, r: any) => s + r.netWeight + r.returnedMaterial, 0)
    : 0;
  const remaining = issue ? +(issue.issuedWeight - receivedSoFar).toFixed(3) : 0;
  const wastage = issue ? +(remaining - netWeight - ret).toFixed(3) : 0;
  const wastagePercent =
    issue && issue.issuedWeight > 0 ? +((wastage / issue.issuedWeight) * 100).toFixed(2) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) {
      setError("Select an issue entry");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await apiFetch("/api/receives", {
        method: "POST",
        body: {
          vendorId: issue.vendorId,
          issueId: issue.id,
          itemName,
          grossWeight: gross,
          stoneWeight: stone,
          returnedMaterial: ret,
          qualityRemarks,
          receiveDate,
        },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.message ?? "Failed");
        return;
      }
      qc.invalidateQueries({ queryKey: ["receives"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("receive.newReceive")}</DialogTitle>
          <DialogDescription>Receive finished jewellery from a vendor</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Issue Entry (to track consumption)</Label>
            <Select
              value={issueId ?? ""}
              onChange={(e) => setIssueId(e.target.value || null)}
              required
            >
              <option value="">Select original issue...</option>
              {(issues.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} — {i.vendor.name} — {i.issuedWeight}g {i.material} {i.purity}
                </option>
              ))}
            </Select>
          </div>

          {issue && (
            <div className="col-span-2 rounded-md bg-brand-primaryLight border border-brand-primary/20 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-textSecondary">Original issue:</span>
                <span className="font-semibold tabular-nums">
                  {issue.issuedWeight.toFixed(3)}g {issue.material} {issue.purity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">Already received:</span>
                <span className="tabular-nums">{receivedSoFar.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">Remaining to account:</span>
                <span className="font-semibold tabular-nums text-brand-primary">
                  {remaining.toFixed(3)}g
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5 col-span-2">
            <Label>{t("receive.itemName")}</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g. Bangle Set, Necklace, Ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("material.grossWeight")} ({t("weight.grams")})
            </Label>
            <Input
              type="number"
              step="0.001"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("material.stoneWeight")} (g)</Label>
            <Input
              type="number"
              step="0.001"
              value={stoneWeight}
              onChange={(e) => setStoneWeight(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("material.netWeight")} (auto)</Label>
            <Input
              value={netWeight.toFixed(3)}
              readOnly
              className="bg-surfaceElevated tabular-nums font-bold text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("receive.returnedMaterial")} (g)</Label>
            <Input
              type="number"
              step="0.001"
              value={returnedMaterial}
              onChange={(e) => setReturnedMaterial(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <div
              className={`rounded-md border px-3 py-2 text-xs flex items-center justify-between ${
                wastagePercent > 10
                  ? "bg-danger/10 border-danger/30 text-danger"
                  : "bg-success/10 border-success/30 text-success"
              }`}
            >
              <span className="font-semibold flex items-center gap-1.5">
                {wastagePercent > 10 && <AlertCircle className="size-3.5" />}
                Wastage
              </span>
              <span className="tabular-nums font-bold">
                {wastage.toFixed(3)}g ({wastagePercent.toFixed(2)}%)
                {wastagePercent > 10 && " — Review!"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Received Date</Label>
            <Input
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("receive.qualityRemarks")}</Label>
            <Input value={qualityRemarks} onChange={(e) => setQualityRemarks(e.target.value)} />
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
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
