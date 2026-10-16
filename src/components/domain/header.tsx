"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  queryKeys,
  defaultLedgerParams,
  fetchLedgerTransactions,
  fetchAnalyticsSummary,
  fetchRecentTransactions,
} from "@/lib/queries";

interface HeaderProps {
  activeTab: "overview" | "ledger";
  onOpenAddModal?: () => void;
  userProfile?: { fullName: string; email: string } | null;
  onLogout: () => void;
}

/**
 * Institutional Header Navigation Component
 * Provides kinematic sliding layout tab transitions, tactile button scaling,
 * zero-FOUC theme switching, and identity display.
 */
export function Header({
  activeTab,
  userProfile,
  onLogout,
}: HeaderProps) {
  const queryClient = useQueryClient();
  const [optimisticTab, setOptimisticTab] = useState<"overview" | "ledger" | null>(null);

  // Clear optimistic override once prop catches up
  if (optimisticTab && activeTab === optimisticTab) {
    setOptimisticTab(null);
  }

  const currentTab = optimisticTab ?? activeTab;

  // Hover pre-warm triggers to guarantee 0ms latency on click
  const prefetchOverview = () => {
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
  };

  const prefetchLedger = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ledgerTransactions(defaultLedgerParams),
      queryFn: () => fetchLedgerTransactions(defaultLedgerParams),
      staleTime: 60 * 1000,
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          <Link
            href="/"
            prefetch={true}
            onMouseEnter={prefetchOverview}
            className="btn-tactile flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-sm border border-zinc-800 dark:border-zinc-200 transition-transform duration-150 group-hover:scale-105">
              ET
            </div>
            <span className="hidden sm:inline font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              Expense Tracker
            </span>
          </Link>

          {/* Navigation Tabs with Kinematic Sliding Layout Pill */}
          <nav
            className="relative flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs"
            aria-label="Main Navigation"
          >
            <Link
              href="/"
              prefetch={true}
              onMouseEnter={prefetchOverview}
              onClick={() => setOptimisticTab("overview")}
              className={`relative px-3.5 py-1.5 rounded-lg font-medium transition-colors duration-150 cursor-pointer ${
                currentTab === "overview"
                  ? "text-white dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {currentTab === "overview" && (
                <motion.div
                  layoutId="active-nav-tab"
                  className="absolute inset-0 bg-zinc-950 dark:bg-zinc-100 rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 550, damping: 36 }}
                />
              )}
              <span className="relative z-10">Overview</span>
            </Link>

            <Link
              href="/ledger"
              prefetch={true}
              onMouseEnter={prefetchLedger}
              onClick={() => setOptimisticTab("ledger")}
              className={`relative px-3.5 py-1.5 rounded-lg font-medium transition-colors duration-150 cursor-pointer ${
                currentTab === "ledger"
                  ? "text-white dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {currentTab === "ledger" && (
                <motion.div
                  layoutId="active-nav-tab"
                  className="absolute inset-0 bg-zinc-950 dark:bg-zinc-100 rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 550, damping: 36 }}
                />
              )}
              <span className="relative z-10">Ledger</span>
            </Link>
          </nav>
        </div>

        {/* Right: Identity, Theme, Logout */}
        <div className="flex items-center gap-2.5">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                {userProfile.fullName}
              </span>
            </div>
          )}

          <ThemeToggle />

          <button
            type="button"
            onClick={onLogout}
            className="btn-tactile inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
