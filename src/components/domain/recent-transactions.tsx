"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowDownRight, ArrowUpRight, Plus, FileSpreadsheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import type { TransactionItem } from "@/components/domain/transaction-table";
import {
  queryKeys,
  defaultLedgerParams,
  fetchLedgerTransactions,
} from "@/lib/queries";

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onOpenAddModal: () => void;
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions,
  onOpenAddModal,
  isLoading = false,
}: RecentTransactionsProps) {
  const queryClient = useQueryClient();
  const displayItems = transactions.slice(0, 5);

  const prefetchLedger = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ledgerTransactions(defaultLedgerParams),
      queryFn: () => fetchLedgerTransactions(defaultLedgerParams),
      staleTime: 60 * 1000,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <EdgeCornerFrame className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recent Activity
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Latest recorded entries across your ledger
          </p>
        </div>
        <Link
          href="/ledger"
          prefetch={true}
          onMouseEnter={prefetchLedger}
          className="btn-tactile inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group cursor-pointer"
        >
          <span>View Full Ledger</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        <AnimatePresence mode="popLayout" initial={false}>
          {isLoading ? (
            <motion.div
              key="loading-recent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-xs text-zinc-400"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-zinc-50 animate-ping" />
                Loading recent entries...
              </div>
            </motion.div>
          ) : displayItems.length === 0 ? (
            <motion.div
              key="empty-recent"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="py-10 text-center text-zinc-400"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  No transactions recorded yet
                </p>
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="btn-tactile mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record First Entry
                </button>
              </div>
            </motion.div>
          ) : (
            displayItems.map((tx) => (
              <motion.div
                key={tx.id}
                layout="position"
                initial={false}
                exit={{ opacity: 0 }}
                transition={{
                  layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
                  opacity: { duration: 0.12 },
                }}
                className="py-3 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 -mx-2 px-2 rounded-lg transition-colors group cursor-default"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                      tx.type === "INCOME"
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30"
                        : "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30"
                    }`}
                  >
                    {tx.type === "INCOME" ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                      title={tx.description || tx.category.name}
                    >
                      {tx.description || tx.category.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-zinc-400">
                        {formatDate(tx.date)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                        {tx.category.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      tx.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-800 dark:text-zinc-200 font-medium"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {displayItems.length > 0 && (
        <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/60 text-center">
          <Link
            href="/ledger"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium transition-colors"
          >
            Looking for older records? <span className="font-semibold underline">Open Complete Ledger →</span>
          </Link>
        </div>
      )}
    </EdgeCornerFrame>
  );
}
