"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { t } = useTranslation();
  const me = useQuery<any>({
    queryKey: ["me"],
    queryFn: () => api("/api/auth/me"),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-xs text-textSecondary mt-0.5">Configure your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {me.data?.user && (
            <>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-textSecondary">Name</span>
                <span className="text-sm font-semibold">{me.data.user.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-textSecondary">Email</span>
                <span className="text-sm font-mono">{me.data.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-textSecondary">Role</span>
                <Badge variant={me.data.user.role === "ADMIN" ? "default" : "outline"}>
                  {me.data.user.role}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
          <CardDescription>Switch between English and Hindi (हिन्दी)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-textSecondary">
            Your selection is saved to your browser instantly.
          </p>
          <LanguageToggle />
        </CardContent>
      </Card>
    </div>
  );
}
