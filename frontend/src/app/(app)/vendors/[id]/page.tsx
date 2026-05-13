"use client";
import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, MapPin, Briefcase, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { formatDate, formatNumber } from "@/lib/utils";
import { api } from "@/lib/api";

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
  const id = Number(params.id);

  const detail = useQuery<any>({
    queryKey: ["vendor", id],
    queryFn: () => api(`/api/vendors/${id}`),
  });
  const balance = useQuery<any>({
    queryKey: ["vendor-balance", id],
    queryFn: () => api(`/api/vendors/${id}/balance`),
  });

  if (!detail.data) return <div className="text-textMuted">{t("common.loading")}</div>;
  const v = detail.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/vendors" className="inline-flex items-center gap-1 text-xs text-textSecondary hover:text-brand-primary">
        <ArrowLeft className="size-3.5" />
        {t("common.back")}
      </Link>

      <Card>
        <CardContent className="pt-6 flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-primary text-white font-bold grid place-items-center text-2xl">
            {v.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold">{v.name}</h1>
              <Badge variant={v.isActive ? "success" : "outline"}>
                {v.isActive ? t("status.active") : t("status.inactive")}
              </Badge>
            </div>
            {v.nameHi && <div className="text-sm text-textSecondary">{v.nameHi}</div>}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-textSecondary">
              {v.contact && (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  {v.contact}
                </div>
              )}
              {v.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {v.phone}
                </div>
              )}
              {v.specialty && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  {v.specialty}
                </div>
              )}
              {v.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {v.address}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {balance.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Issued"
            value={`${formatNumber(balance.data.issued)} g`}
            accent="primary"
          />
          <StatCard
            title="Received (Net)"
            value={`${formatNumber(balance.data.received)} g`}
            accent="success"
          />
          <StatCard
            title="Returned"
            value={`${formatNumber(balance.data.returned)} g`}
            accent="secondary"
          />
          <StatCard
            title="Pending"
            value={`${formatNumber(balance.data.pending)} g`}
            subtitle={`Wastage ${balance.data.wastagePercent.toFixed(2)}%`}
            accent={balance.data.pending > 0 ? "warning" : "success"}
          />
        </div>
      )}

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Material Issued</TabsTrigger>
          <TabsTrigger value="receives">Jewellery Received</TabsTrigger>
          <TabsTrigger value="returns">Raw Material Returned</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Purity</TableHead>
                    <TableHead className="text-right">Issued (g)</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.issues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-textMuted">
                        No issues yet
                      </TableCell>
                    </TableRow>
                  )}
                  {v.issues.map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs">{formatDate(i.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={i.material === "GOLD" ? "gold" : "silver"}>
                          {i.material}
                        </Badge>
                      </TableCell>
                      <TableCell>{i.purity}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatNumber(i.issuedWeight)}
                      </TableCell>
                      <TableCell className="text-xs">{i.purpose ?? "—"}</TableCell>
                      <TableCell className="text-xs">{formatDate(i.expectedReturn)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            i.status === "OVERDUE"
                              ? "danger"
                              : i.status === "RETURNED"
                                ? "success"
                                : "default"
                          }
                        >
                          {i.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receives">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Gross (g)</TableHead>
                    <TableHead className="text-right">Stone (g)</TableHead>
                    <TableHead className="text-right">Net (g)</TableHead>
                    <TableHead className="text-right">Wastage %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.receives.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-textMuted">
                        No receives yet
                      </TableCell>
                    </TableRow>
                  )}
                  {v.receives.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{formatDate(r.receiveDate)}</TableCell>
                      <TableCell className="font-medium">{r.itemName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.grossWeight)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.stoneWeight)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatNumber(r.netWeight)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-semibold ${
                          r.wastagePercent > 10 ? "text-danger" : "text-textPrimary"
                        }`}
                      >
                        {r.wastagePercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Returned Material (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.receives.filter((r: any) => r.returnedMaterial > 0).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-textMuted">
                        No raw material returned
                      </TableCell>
                    </TableRow>
                  )}
                  {v.receives
                    .filter((r: any) => r.returnedMaterial > 0)
                    .map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{formatDate(r.receiveDate)}</TableCell>
                        <TableCell>{r.itemName}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatNumber(r.returnedMaterial)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
