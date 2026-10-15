"use client";

import React from "react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { TextReveal } from "@/components/ui/text-reveal";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface KpiStripProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  activeMonth?: string;
}

export function KpiStrip({
  totalIncome,
  totalExpenses,
  netBalance,
  savingsRate,
  activeMonth,
}: KpiStripProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Income */}
      <EdgeCornerFrame glowColor="emerald" interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Income
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <TextReveal delayMs={50}>{formatCurrency(totalIncome)}</TextReveal>
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {activeMonth ? `${activeMonth} active income` : "Total recorded income"}
        </p>
      </EdgeCornerFrame>

      {/* 2. Total Expenses */}
      <EdgeCornerFrame glowColor="rose" interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Expenses
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <TextReveal delayMs={100}>{formatCurrency(totalExpenses)}</TextReveal>
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {activeMonth ? `${activeMonth} expenditures` : "Total recorded expenses"}
        </p>
      </EdgeCornerFrame>

      {/* 3. Net Balance */}
      <EdgeCornerFrame
        glowColor={netBalance >= 0 ? "indigo" : "amber"}
        interactive
        className="p-3.5 sm:p-5"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Net Cash Flow
          </span>
          <div
            className={`p-1.5 sm:p-2 rounded-xl ${
              netBalance >= 0
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <TextReveal delayMs={150}>{formatCurrency(netBalance)}</TextReveal>
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">
          {netBalance >= 0 ? "Positive surplus" : "Negative deficit"}
        </p>
      </EdgeCornerFrame>

      {/* 4. Savings Rate */}
      <EdgeCornerFrame glowColor="amber" interactive className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Savings Rate
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <TextReveal delayMs={200}>{savingsRate.toFixed(1)}%</TextReveal>
        </div>
        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-400 truncate">Of monthly earnings saved</p>
      </EdgeCornerFrame>
    </div>
  );
}
