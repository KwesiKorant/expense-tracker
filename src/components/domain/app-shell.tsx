"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/domain/header";
import { useTransactionRealtime } from "@/hooks/use-transaction-realtime";
import {
  queryKeys,
  defaultLedgerParams,
  fetchLedgerTransactions,
  fetchAnalyticsSummary,
  fetchRecentTransactions,
} from "@/lib/queries";

/**
 * AppShell — Persistent Institutional Layout Primitive
 * Ensures the Header, ThemeToggle, and Realtime WebSocket connection never unmount
 * during navigation between Overview (/) and Ledger (/ledger).
 * Eliminates nav pill jumping, header flashes, blank opacity fades, and layout thrashing.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Authenticated user profile query (cached across routes)
  const { data: userProfile } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) {
        if (res.status === 401 && !isAuthPage) {
          router.push("/login");
          return null;
        }
        return null;
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !isAuthPage,
    staleTime: 5 * 60 * 1000,
  });

  // Persistent Realtime CDC subscription across dashboard navigation
  useTransactionRealtime(userProfile?.id);

  // Proactive background pre-warming of cross-tab queries & Next.js routes
  useEffect(() => {
    if (!userProfile?.id || isAuthPage) return;

    // Prefetch Next.js route JS bundles for instantaneous client navigation
    router.prefetch("/");
    router.prefetch("/ledger");

    // Proactively pre-warm Ledger data into TanStack cache
    queryClient.prefetchQuery({
      queryKey: queryKeys.ledgerTransactions(defaultLedgerParams),
      queryFn: () => fetchLedgerTransactions(defaultLedgerParams),
      staleTime: 60 * 1000,
    });

    // Proactively pre-warm Overview analytics & recent transactions
    queryClient.prefetchQuery({
      queryKey: queryKeys.analyticsSummary,
      queryFn: fetchAnalyticsSummary,
      staleTime: 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.recentTransactions,
      queryFn: fetchRecentTransactions,
      staleTime: 60 * 1000,
    });
  }, [userProfile?.id, isAuthPage, queryClient, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      queryClient.clear();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // If on login/register, render standalone without dashboard header
  if (isAuthPage) {
    return <>{children}</>;
  }

  const activeTab = pathname.startsWith("/ledger") ? "ledger" : "overview";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Persistent Stable Header */}
      <Header
        activeTab={activeTab}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Page Content (Direct Frame-0 Render with Zero Blanking or Opacity Latency) */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
