"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { KpiStrip } from "@/components/domain/kpi-strip";
import { CashFlowChart } from "@/components/domain/cash-flow-chart";
import { CategoryDonutChart } from "@/components/domain/category-donut-chart";
import { TransactionTable, type TransactionItem } from "@/components/domain/transaction-table";
import { TransactionSheet } from "@/components/domain/transaction-sheet";
import { useTransactionRealtime } from "@/hooks/use-transaction-realtime";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Ledger state filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showArchived, setShowArchived] = useState(false);
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

  // 3. Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      if (!res.ok) return [];
      const data = await res.json();
      return data.data.categories;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes per TRD
  });

  // 4. Fetch Analytics Summary
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/summary");
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    },
  });

  // 5. Fetch Ledger Transactions
  const { data: transactionsData, isPending: isLedgerLoading } = useQuery({
    queryKey: ["transactions", { page, search, selectedType, selectedCategory, showArchived }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (selectedType) params.set("type", selectedType);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      params.set("isArchived", String(showArchived));

      const res = await fetch(`/api/v1/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
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

  // Transaction archive handler
  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  // Transaction restore handler
  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/transactions/${id}/restore`, { method: "POST" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const transactions: TransactionItem[] = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination || { total: 0, totalPages: 1 };

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
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-sm border border-zinc-800 dark:border-zinc-200">
              ET
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                Expense Tracker
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                Arc-AA 120 FPS
              </span>
            </div>
          </div>

          {/* User Controls & Theme */}
          <div className="flex items-center gap-3">
            {userProfile && (
              <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                  {userProfile.fullName}
                </span>
              </div>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 active:scale-90 transition-all duration-150 cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

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
            <CashFlowChart data={cashFlowHistory} />
          </div>
          <div className="lg:col-span-1">
            <CategoryDonutChart
              data={categoryDistribution}
              totalExpenses={metrics.totalExpenses}
            />
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <TransactionTable
          transactions={transactions}
          total={pagination.total}
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          categories={categories}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          selectedType={selectedType}
          onTypeChange={(val) => {
            setSelectedType(val);
            setPage(1);
          }}
          selectedCategory={selectedCategory}
          onCategoryChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
          showArchived={showArchived}
          onToggleArchived={(val) => {
            setShowArchived(val);
            setPage(1);
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onArchive={handleArchive}
          onRestore={handleRestore}
          isLoading={isLedgerLoading}
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
