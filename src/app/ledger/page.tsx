"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/domain/header";
import { TransactionTable, type TransactionItem } from "@/components/domain/transaction-table";
import { TransactionSheet } from "@/components/domain/transaction-sheet";
import { useTransactionRealtime } from "@/hooks/use-transaction-realtime";

export default function LedgerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Ledger state filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionItem | null>(null);

  const handleOpenAdd = () => {
    setTransactionToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tx: TransactionItem) => {
    setTransactionToEdit(tx);
    setIsAddModalOpen(true);
  };

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
    staleTime: 15 * 60 * 1000,
  });

  // 4. Fetch Ledger Transactions
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

  // Permanent purge handler
  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/transactions/${id}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  const transactions: TransactionItem[] = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination || { total: 0, totalPages: 1 };

  if (authError) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Shared Header Navigation */}
      <Header
        activeTab="ledger"
        onOpenAddModal={handleOpenAdd}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content Ledger */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Ledger Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Transaction Ledger
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Complete multi-tenant audit trail with instant keyboard search and category filtering
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {pagination.total} Records
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Page {page} of {pagination.totalPages}
            </span>
          </div>
        </div>

        {/* Transaction Ledger Table Component */}
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
          onOpenAddModal={handleOpenAdd}
          onEdit={handleOpenEdit}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          isLoading={isLedgerLoading}
        />
      </main>

      {/* Quick-Add / Edit Transaction Sheet Modal */}
      <TransactionSheet
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }}
        categories={categories}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}
