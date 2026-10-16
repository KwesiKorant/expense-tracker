"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Header } from "@/components/domain/header";
import { useTransactionRealtime } from "@/hooks/use-transaction-realtime";

/**
 * AppShell — Persistent Institutional Layout Primitive
 * Ensures the Header, ThemeToggle, and Realtime WebSocket connection never unmount
 * during navigation between Overview (/) and Ledger (/ledger).
 * Eliminates nav pill jumping, header flashes, and layout thrashing.
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

      {/* Smooth Compositor-Only Page Content Transition */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
}
