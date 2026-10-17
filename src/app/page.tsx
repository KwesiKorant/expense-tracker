"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KpiStrip } from "@/components/domain/kpi-strip";
import { CashFlowChart } from "@/components/domain/cash-flow-chart";
import { CategoryDonutChart } from "@/components/domain/category-donut-chart";
import { RecentTransactions } from "@/components/domain/recent-transactions";
import { TransactionSheet } from "@/components/domain/transaction-sheet";
import { FirstRunChecklist } from "@/components/domain/first-run-checklist";
import { TextReveal } from "@/components/ui/text-reveal";
import { ScrollToTop, ScrollToTopSentinel } from "@/components/ui/scroll-to-top";
import {
  queryKeys,
  fetchCategories,
  fetchAnalyticsSummary,
  fetchRecentTransactions,
} from "@/lib/queries";

export default function DashboardOverviewPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Fetch categories for quick-add modal
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 15 * 60 * 1000,
  });

  // 2. Fetch Analytics Summary
  const { data: analytics, isPending: isAnalyticsLoading } = useQuery({
    queryKey: queryKeys.analyticsSummary,
    queryFn: fetchAnalyticsSummary,
    staleTime: 60 * 1000,
  });

  // 3. Fetch Recent Transactions (top 5 for dashboard overview)
  const { data: recentTransactionsData, isPending: isRecentLoading } = useQuery({
    queryKey: queryKeys.recentTransactions,
    queryFn: fetchRecentTransactions,
    staleTime: 60 * 1000,
  });

  const recentTransactions = recentTransactionsData?.transactions || [];
  const totalTransactions =
    recentTransactionsData?.pagination?.total ?? recentTransactions.length;

  const metrics = analytics?.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    savingsRate: 0,
  };
  const cashFlowHistory = analytics?.cashFlowHistory || [];
  const categoryDistribution = analytics?.categoryDistribution || [];

  return (
    <main className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Zero-Layout Sentinel for Smooth Scroll-To-Top Observer */}
      <ScrollToTopSentinel />

      {/* Overview Header Title (Harmonized Layout Rhythm) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <TextReveal
            as="h1"
            delayMs={60}
            durationMs={750}
            yOffset={14}
            className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Financial Overview
          </TextReveal>
          <TextReveal
            as="p"
            delayMs={220}
            durationMs={800}
            yOffset={12}
            className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
          >
            Real-time multi-tenant cash flow telemetry, category breakdowns, and performance analytics
          </TextReveal>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {metrics.activeMonth || "Current Period"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>
      </div>

      {/* First-Run Progressive Onboarding Checklist (Clean & Dismissible) */}
      <FirstRunChecklist
        totalTransactions={totalTransactions}
        isLoading={isRecentLoading}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* KPI Summary Cards */}
      <KpiStrip
        totalIncome={metrics.totalIncome}
        totalExpenses={metrics.totalExpenses}
        netBalance={metrics.netBalance}
        savingsRate={metrics.savingsRate}
        activeMonth={metrics.activeMonth}
        isLoading={isAnalyticsLoading}
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart
            data={cashFlowHistory}
            isLoading={isAnalyticsLoading}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryDonutChart
            data={categoryDistribution}
            totalExpenses={metrics.totalExpenses}
            isLoading={isAnalyticsLoading}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </div>
      </div>

      {/* Recent Activity Mini-Ledger with Direct Link to Full Ledger */}
      <RecentTransactions
        transactions={recentTransactions}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isLoading={isRecentLoading}
      />

      {/* Quick-Add Transaction Sheet / Modal */}
      <TransactionSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        categories={categories}
      />
      {/* Sleek Floating Scroll-To-Top Button */}
      <ScrollToTop />
    </main>
  );
}
