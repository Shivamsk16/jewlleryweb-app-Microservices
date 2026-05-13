"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, User as UserIcon, Gem } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./language-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { api, apiFetch } from "@/lib/api";

type Me = { id: number; email: string; name: string; role: "ADMIN" | "USER" } | null;
type Notif = {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export function Header() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: me } = useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const j = await api<{ user: Me }>("/api/auth/me");
        return j.user ?? null;
      } catch {
        return null;
      }
    },
  });

  const { data: notifications, refetch } = useQuery<Notif[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        return await api<Notif[]>("/api/notifications");
      } catch {
        return [];
      }
    },
    refetchInterval: 60_000,
  });

  const unread = (notifications ?? []).filter((n) => !n.isRead).length;

  const onLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border no-print">
      <div className="flex items-center justify-between gap-3 px-4 lg:px-8 h-14">
        <div className="lg:hidden flex items-center gap-2">
          <div className="h-8 w-8 grid place-items-center rounded-md bg-brand-primary text-white">
            <Gem className="size-4" />
          </div>
          <span className="font-display font-bold text-brand-primary">JewelFlow</span>
        </div>

        <div className="hidden lg:flex" />

        <div className="flex items-center gap-2">
          <LanguageToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surfaceElevated transition-colors"
                title="Notifications"
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {(notifications ?? []).length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-textMuted">No notifications</div>
                )}
                {(notifications ?? []).slice(0, 8).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    onClick={async () => {
                      await apiFetch(`/api/notifications/${n.id}/read`, { method: "PUT" });
                      refetch();
                    }}
                    className={cn(
                      "block px-3 py-2 rounded-sm hover:bg-surfaceElevated text-sm",
                      !n.isRead && "bg-brand-primaryLight/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          n.type === "OVERDUE"
                            ? "bg-danger"
                            : n.type === "DUE_SOON"
                              ? "bg-warning"
                              : "bg-brand-primary",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{n.title}</div>
                        <div className="text-xs text-textSecondary line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-textMuted mt-1">
                          {formatDateTime(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {me && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-9 px-2 rounded-md border border-border bg-surface hover:bg-surfaceElevated text-sm">
                  <div className="h-6 w-6 rounded-full bg-brand-primary text-white grid place-items-center text-[11px] font-bold">
                    {me.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold">{me.name}</span>
                    <span className="text-[10px] text-textMuted">{me.role}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="font-semibold">{me.name}</div>
                  <div className="text-[10px] text-textMuted font-normal">{me.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <UserIcon className="size-4" />
                    {t("settings.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-danger hover:text-danger">
                  <LogOut className="size-4" />
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
