"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KpiStrip } from "@/components/domain/kpi-strip";
import { CashFlowChart } from "@/components/domain/cash-flow-chart";
import { CategoryDonutChart } from "@/components/domain/category-donut-chart";
import { RecentTransactions } from "@/components/domain/recent-transactions";
import { TransactionSheet } from "@/components/domain/transaction-sheet";

export default function DashboardOverviewPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Fetch categories for quick-add modal
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      if (!res.ok) return [];
      const data = await res.json();
      return data.data.categories;
    },
    staleTime: 15 * 60 * 1000,
  });

  // 2. Fetch Analytics Summary
  const { data: analytics, isPending: isAnalyticsLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/summary");
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    },
  });

  // 3. Fetch Recent Transactions (top 5 for dashboard overview)
  const { data: recentTransactionsData, isPending: isRecentLoading } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/v1/transactions?page=1&limit=5&isArchived=false");
      if (!res.ok) throw new Error("Failed to load recent transactions");
      const data = await res.json();
      return data.data;
    },
  });

  const recentTransactions = recentTransactionsData?.transactions || [];

  const metrics = analytics?.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    savingsRate: 0,
  };
  const cashFlowHistory = analytics?.cashFlowHistory || [];
  const categoryDistribution = analytics?.categoryDistribution || [];

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <CashFlowChart data={cashFlowHistory} isLoading={isAnalyticsLoading} />
        </div>
        <div className="lg:col-span-1">
          <CategoryDonutChart
            data={categoryDistribution}
            totalExpenses={metrics.totalExpenses}
            isLoading={isAnalyticsLoading}
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
    </main>
  );
}
