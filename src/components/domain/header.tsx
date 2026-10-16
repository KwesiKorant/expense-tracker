"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, User as UserIcon, X } from "lucide-react";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutConfirm]);

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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 glass-header">
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
              scroll={false}
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
              scroll={false}
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
            onClick={() => setShowLogoutConfirm(true)}
            className="btn-tactile inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 hover:border-rose-300/60 dark:hover:border-rose-800/60 cursor-pointer transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    {/* Institutional Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 glass-backdrop"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="relative z-10 w-full max-w-sm bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 id="logout-dialog-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-4">
                Sign out of Expense Tracker?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Are you sure you want to end your active session? You will need to log back in to access your ledger.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-tactile px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-sm shadow-rose-950/20 active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
