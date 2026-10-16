"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/domain/header";
import { KpiStrip } from "@/components/domain/kpi-strip";
import { CashFlowChart } from "@/components/domain/cash-flow-chart";
import { CategoryDonutChart } from "@/components/domain/category-donut-chart";
import { RecentTransactions } from "@/components/domain/recent-transactions";
import { TransactionSheet } from "@/components/domain/transaction-sheet";
import { useTransactionRealtime } from "@/hooks/use-transaction-realtime";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Fetch authenticated user profile
  const { data: userProfile, isError: authError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        throw new Error("Failed to load user profile");
      }
      const data = await res.json();
      return data.data;
    },
  });

  // 2. Realtime CDC subscription for live multi-tab cache invalidation
  useTransactionRealtime(userProfile?.id);

  // 3. Fetch categories for quick-add modal
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

  // 4. Fetch Analytics Summary
  const { data: analytics, isPending: isAnalyticsLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/summary");
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    },
  });

  // 5. Fetch Recent Transactions (top 5 for dashboard overview)
  const { data: recentTransactionsData, isPending: isRecentLoading } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/v1/transactions?page=1&limit=5&isArchived=false");
      if (!res.ok) throw new Error("Failed to load recent transactions");
      const data = await res.json();
      return data.data;
    },
  });

  // Logout handler
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

  const recentTransactions = recentTransactionsData?.transactions || [];

  const metrics = analytics?.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    savingsRate: 0,
  };
  const cashFlowHistory = analytics?.cashFlowHistory || [];
  const categoryDistribution = analytics?.categoryDistribution || [];

  if (authError) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Shared Header Navigation */}
      <Header
        activeTab="overview"
        onOpenAddModal={() => setIsAddModalOpen(true)}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Summary Cards */}
        <KpiStrip
          totalIncome={metrics.totalIncome}
          totalExpenses={metrics.totalExpenses}
          netBalance={metrics.netBalance}
          savingsRate={metrics.savingsRate}
          activeMonth={metrics.activeMonth}
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
      </main>

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
    </div>
  );
}
