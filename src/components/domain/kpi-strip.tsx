"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 32,
    },
  },
};

/**
 * KpiStrip Primitive — Arc-AA Compositor Standard
 * Staggered GPU-accelerated card entry with directional subtitle reveal.
 */
export function KpiStrip({
  totalIncome,
  totalExpenses,
  netBalance,
  savingsRate,
  activeMonth,
  isLoading = false,
}: KpiStripProps) {
  const isSurplus = netBalance >= 0;

  return (
    <motion.div
      variants={containerVariants}
      initial={false}
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {/* 1. Total Income */}
      <motion.div variants={cardItemVariants}>
        <EdgeCornerFrame interactive className="p-3.5 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Income
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 transition-transform duration-150 hover:scale-105 active:scale-95">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
            {isLoading ? (
              <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <AnimatedCounter
                value={totalIncome}
                formatAsCurrency={true}
                animateOnMount={false}
              />
            )}
          </div>
          <div className="mt-1 sm:mt-2 h-4 sm:h-5 overflow-hidden flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={activeMonth || "default-income"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="text-[10px] sm:text-xs text-zinc-400 truncate w-full"
              >
                {activeMonth ? `${activeMonth} active income` : "Total recorded income"}
              </motion.p>
            </AnimatePresence>
          </div>
        </EdgeCornerFrame>
      </motion.div>

      {/* 2. Total Expenses */}
      <motion.div variants={cardItemVariants}>
        <EdgeCornerFrame interactive className="p-3.5 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Expenses
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 transition-transform duration-150 hover:scale-105 active:scale-95">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
            {isLoading ? (
              <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <AnimatedCounter
                value={totalExpenses}
                formatAsCurrency={true}
                animateOnMount={false}
              />
            )}
          </div>
          <div className="mt-1 sm:mt-2 h-4 sm:h-5 overflow-hidden flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={activeMonth || "default-expenses"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="text-[10px] sm:text-xs text-zinc-400 truncate w-full"
              >
                {activeMonth ? `${activeMonth} expenditures` : "Total recorded expenses"}
              </motion.p>
            </AnimatePresence>
          </div>
        </EdgeCornerFrame>
      </motion.div>

      {/* 3. Net Balance */}
      <motion.div variants={cardItemVariants}>
        <EdgeCornerFrame interactive className="p-3.5 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Net Cash Flow
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 transition-transform duration-150 hover:scale-105 active:scale-95">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
            {isLoading ? (
              <div className="w-28 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <AnimatedCounter
                value={netBalance}
                formatAsCurrency={true}
                animateOnMount={false}
              />
            )}
          </div>
          <div className="mt-1 sm:mt-2 h-4 sm:h-5 overflow-hidden flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={isSurplus ? "surplus" : "deficit"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="text-[10px] sm:text-xs text-zinc-400 truncate w-full"
              >
                {isSurplus ? "Positive surplus" : "Negative deficit"}
              </motion.p>
            </AnimatePresence>
          </div>
        </EdgeCornerFrame>
      </motion.div>

      {/* 4. Savings Rate */}
      <motion.div variants={cardItemVariants}>
        <EdgeCornerFrame interactive className="p-3.5 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Savings Rate
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 transition-transform duration-150 hover:scale-105 active:scale-95">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 h-8 flex items-center min-w-0 truncate">
            {isLoading ? (
              <div className="w-20 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ) : (
              <AnimatedCounter
                value={Number.isFinite(savingsRate) ? savingsRate : 0}
                formatAsCurrency={false}
                suffix="%"
                decimals={1}
                animateOnMount={false}
              />
            )}
          </div>
          <div className="mt-1 sm:mt-2 h-4 sm:h-5 overflow-hidden flex items-center">
            <p className="text-[10px] sm:text-xs text-zinc-400 truncate w-full">
              Of monthly earnings saved
            </p>
          </div>
        </EdgeCornerFrame>
      </motion.div>
    </motion.div>
  );
}
