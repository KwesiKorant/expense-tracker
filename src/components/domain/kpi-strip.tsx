"use client";

import React from "react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { TextReveal } from "@/components/ui/text-reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface KpiStripProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  activeMonth?: string;
  isLoading?: boolean;
}

export function KpiStrip({
  totalIncome,
  totalExpenses,
  netBalance,
  savingsRate,
  activeMonth,
  isLoading = false,
}: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Income */}
      <EdgeCornerFrame interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Income
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
          {isLoading ? (
            <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <TextReveal delayMs={40}>
              <AnimatedCounter value={totalIncome} formatAsCurrency={true} />
            </TextReveal>
          )}
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {activeMonth ? `${activeMonth} active income` : "Total recorded income"}
        </p>
      </EdgeCornerFrame>

      {/* 2. Total Expenses */}
      <EdgeCornerFrame interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Expenses
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
          {isLoading ? (
            <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <TextReveal delayMs={80}>
              <AnimatedCounter value={totalExpenses} formatAsCurrency={true} />
            </TextReveal>
          )}
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {activeMonth ? `${activeMonth} expenditures` : "Total recorded expenses"}
        </p>
      </EdgeCornerFrame>

      {/* 3. Net Balance */}
      <EdgeCornerFrame interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Net Cash Flow
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
          {isLoading ? (
            <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <TextReveal delayMs={120}>
              <AnimatedCounter value={netBalance} formatAsCurrency={true} />
            </TextReveal>
          )}
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {netBalance >= 0 ? "Positive surplus" : "Negative deficit"}
        </p>
      </EdgeCornerFrame>

      {/* 4. Savings Rate */}
      <EdgeCornerFrame interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Savings Rate
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
            <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
          {isLoading ? (
            <div className="w-20 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <TextReveal delayMs={160}>
              <AnimatedCounter
                value={Number.isFinite(savingsRate) ? savingsRate : 0}
                formatAsCurrency={false}
                suffix="%"
                decimals={1}
              />
            </TextReveal>
          )}
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          Of monthly earnings saved
        </p>
      </EdgeCornerFrame>
    </div>
  );
}
