"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, ArrowRight, Plus, Sparkles, X } from "lucide-react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";

interface FirstRunChecklistProps {
  totalTransactions: number;
  isLoading?: boolean;
  onOpenAddModal: () => void;
}

const STORAGE_KEY = "expense_first_run_dismissed";

export function FirstRunChecklist({
  totalTransactions,
  isLoading = false,
  onOpenAddModal,
}: FirstRunChecklistProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default true for SSR safety
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore private browsing storage errors
    }
  };

  // Prevent Flash of Unsettled State (FOUS):
  // 1. Never render while data is still loading
  // 2. Never render if not mounted or dismissed
  // 3. Never render if the user already has recorded transactions
  if (isLoading || !mounted || isDismissed || totalTransactions > 0) {
    return null;
  }

  const step1Done = true; // Account registered & authenticated
  const step2Done = totalTransactions > 0; // Recorded at least 1 transaction
  const step3Done = totalTransactions >= 2; // Explored cash flow / multiple records

  const completedSteps = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / 3) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <EdgeCornerFrame className="p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-zinc-50/70 via-white to-zinc-50/40 dark:from-zinc-900/60 dark:via-zinc-900/40 dark:to-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Welcome to Expense
                  </h2>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {progressPercent}% Complete
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Three quick steps to configure your personal financial telemetry
                </p>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss quickstart checklist"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
              title="Dismiss checklist"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar (Hardware Accelerated Scale3d) */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden my-3">
            <motion.div
              className="h-full bg-zinc-950 dark:bg-emerald-400 rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progressPercent / 100 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
            {/* Step 1 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-through opacity-80">
                  1. Multi-Tenant Session
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Account verified with cryptographic JWT
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                step2Done
                  ? "bg-white/70 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50"
                  : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {step2Done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                )}
                <div className="min-w-0">
                  <span
                    className={`text-xs font-semibold ${
                      step2Done
                        ? "text-zinc-900 dark:text-zinc-100 line-through opacity-80"
                        : "text-zinc-950 dark:text-zinc-50"
                    }`}
                  >
                    2. Record First Entry
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {step2Done ? "Initial ledger entry recorded" : "Log income or expense"}
                  </p>
                </div>
              </div>

              {!step2Done && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="btn-tactile shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log Entry</span>
                </button>
              )}
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                step3Done
                  ? "bg-white/70 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50"
                  : "bg-white/50 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800/50"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {step3Done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span
                    className={`text-xs font-semibold ${
                      step3Done
                        ? "text-zinc-900 dark:text-zinc-100 line-through opacity-80"
                        : "text-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    3. Review Ledger & CSV
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Filter categories or export
                  </p>
                </div>
              </div>

              <Link
                href="/ledger"
                className="btn-tactile shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <span>Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </EdgeCornerFrame>
      </motion.div>
    </AnimatePresence>
  );
}
