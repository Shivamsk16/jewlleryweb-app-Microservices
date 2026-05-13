"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertOctagon, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDate, formatNumber, daysBetween } from "@/lib/utils";
import { api } from "@/lib/api";

export default function RemindersPage() {
  const { t } = useTranslation();

  const overdue = useQuery<any[]>({
    queryKey: ["overdue"],
    queryFn: () => api<any[]>("/api/issues/overdue"),
  });

  const all = useQuery<any[]>({
    queryKey: ["issues-pending"],
    queryFn: () => api<any[]>("/api/issues?status=PENDING"),
  });

  const now = new Date();
  const dueSoon = (all.data ?? []).filter((i) => {
    const days = daysBetween(now, new Date(i.expectedReturn));
    return days >= 0 && days <= 2;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("nav.reminders")}</h1>
        <p className="text-xs text-textSecondary mt-0.5">
          Track overdue items and upcoming due dates
        </p>
      </div>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <AlertOctagon className="size-5" />
            Overdue Issues
            <Badge variant="danger" className="ml-1">{overdue.data?.length ?? 0}</Badge>
          </CardTitle>
          <CardDescription>Issues past their expected return date with pending balance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Issued (g)</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(overdue.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-textMuted">
                    No overdue items — all good!
                  </TableCell>
                </TableRow>
              )}
              {(overdue.data ?? []).map((i) => {
                const days = daysBetween(new Date(i.expectedReturn), now);
                return (
                  <TableRow key={i.id} className="!bg-danger/5">
                    <TableCell className="text-xs">{formatDate(i.issueDate)}</TableCell>
                    <TableCell className="font-medium">{i.vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant={i.material === "GOLD" ? "gold" : "silver"}>
                        {i.material} {i.purity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatNumber(i.issuedWeight)}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(i.expectedReturn)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-danger">
                      {days} days
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <Clock className="size-5" />
            Due Soon (next 2 days)
            <Badge variant="warning" className="ml-1">{dueSoon.length}</Badge>
          </CardTitle>
          <CardDescription>Issues that need attention soon</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Issued (g)</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead className="text-right">Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dueSoon.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-textMuted">
                    Nothing due soon
                  </TableCell>
                </TableRow>
              )}
              {dueSoon.map((i: any) => {
                const days = daysBetween(now, new Date(i.expectedReturn));
                return (
                  <TableRow key={i.id} className="!bg-warning/5">
                    <TableCell className="text-xs">{formatDate(i.issueDate)}</TableCell>
                    <TableCell className="font-medium">{i.vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant={i.material === "GOLD" ? "gold" : "silver"}>
                        {i.material} {i.purity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatNumber(i.issuedWeight)}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(i.expectedReturn)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-warning">
                      {days} day{days !== 1 ? "s" : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
