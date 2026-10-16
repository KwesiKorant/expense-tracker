"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TransactionTable, type TransactionItem } from "@/components/domain/transaction-table";
import { TransactionSheet } from "@/components/domain/transaction-sheet";
import { TextReveal } from "@/components/ui/text-reveal";
import { ScrollToTop, ScrollToTopSentinel } from "@/components/ui/scroll-to-top";
import {
  queryKeys,
  fetchCategories,
  fetchLedgerTransactions,
  type LedgerQueryParams,
} from "@/lib/queries";

export default function LedgerPage() {
  const queryClient = useQueryClient();

  // Ledger state filters & pagination size
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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

  // 1. Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 15 * 60 * 1000,
  });

  // 2. Fetch Ledger Transactions
  const ledgerParams: LedgerQueryParams = useMemo(
    () => ({ page, limit, search, selectedType, selectedCategory, showArchived }),
    [page, limit, search, selectedType, selectedCategory, showArchived]
  );

  const { data: transactionsData, isPending: isLedgerLoading } = useQuery({
    queryKey: queryKeys.ledgerTransactions(ledgerParams),
    queryFn: () => fetchLedgerTransactions(ledgerParams),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const transactions: TransactionItem[] = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination || { total: 0, totalPages: 1 };

  // Proactive Next & Previous Page Prefetching for zero-latency pagination swaps
  useEffect(() => {
    if (page < pagination.totalPages) {
      const nextPageParams = { ...ledgerParams, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: queryKeys.ledgerTransactions(nextPageParams),
        queryFn: () => fetchLedgerTransactions(nextPageParams),
        staleTime: 60 * 1000,
      });
    }
    if (page > 1) {
      const prevPageParams = { ...ledgerParams, page: page - 1 };
      queryClient.prefetchQuery({
        queryKey: queryKeys.ledgerTransactions(prevPageParams),
        queryFn: () => fetchLedgerTransactions(prevPageParams),
        staleTime: 60 * 1000,
      });
    }
  }, [page, pagination.totalPages, ledgerParams, queryClient]);

  // Adjust page if it exceeds totalPages without cascading effect renders
  const [prevTotalPages, setPrevTotalPages] = useState(pagination.totalPages);
  if (pagination.totalPages !== prevTotalPages) {
    setPrevTotalPages(pagination.totalPages);
    if (pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }

  // Optimistic transaction archive handler (0ms perceived latency)
  const handleArchive = async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ["transactions"] });
    const currentKey = queryKeys.ledgerTransactions(ledgerParams);
    const previousLedgerData = queryClient.getQueryData<any>(currentKey);

    // Optimistically remove the transaction from the current view immediately
    queryClient.setQueryData(currentKey, (old: any) => {
      if (!old || !Array.isArray(old.transactions)) return old;
      return {
        ...old,
        transactions: old.transactions.filter((tx: any) => tx.id !== id),
        pagination: {
          ...old.pagination,
          total: Math.max(0, (old.pagination?.total || 1) - 1),
        },
      };
    });

    try {
      const res = await fetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to archive transaction");
      // Silently sync background analytics and counters without blocking the UI
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "none" });
    } catch (err) {
      if (previousLedgerData) {
        queryClient.setQueryData(currentKey, previousLedgerData);
      }
      console.error("Archive failed:", err);
      throw err;
    }
  };

  // Optimistic transaction restore handler (0ms perceived latency)
  const handleRestore = async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ["transactions"] });
    const currentKey = queryKeys.ledgerTransactions(ledgerParams);
    const previousLedgerData = queryClient.getQueryData<any>(currentKey);

    // If currently viewing archived items, optimistically remove it from the list
    if (showArchived) {
      queryClient.setQueryData(currentKey, (old: any) => {
        if (!old || !Array.isArray(old.transactions)) return old;
        return {
          ...old,
          transactions: old.transactions.filter((tx: any) => tx.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, (old.pagination?.total || 1) - 1),
          },
        };
      });
    }

    try {
      const res = await fetch(`/api/v1/transactions/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to restore transaction");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (err) {
      if (previousLedgerData) {
        queryClient.setQueryData(currentKey, previousLedgerData);
      }
      console.error("Restore failed:", err);
      throw err;
    }
  };

  // Optimistic permanent purge handler (0ms perceived latency)
  const handlePermanentDelete = async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ["transactions"] });
    const currentKey = queryKeys.ledgerTransactions(ledgerParams);
    const previousLedgerData = queryClient.getQueryData<any>(currentKey);

    queryClient.setQueryData(currentKey, (old: any) => {
      if (!old || !Array.isArray(old.transactions)) return old;
      return {
        ...old,
        transactions: old.transactions.filter((tx: any) => tx.id !== id),
        pagination: {
          ...old.pagination,
          total: Math.max(0, (old.pagination?.total || 1) - 1),
        },
      };
    });

    try {
      const res = await fetch(`/api/v1/transactions/${id}?permanent=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to purge transaction");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "none" });
    } catch (err) {
      if (previousLedgerData) {
        queryClient.setQueryData(currentKey, previousLedgerData);
      }
      console.error("Permanent delete failed:", err);
      throw err;
    }
  };

  return (
    <main className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Zero-Layout Sentinel for Smooth Scroll-To-Top Observer */}
      <ScrollToTopSentinel />

      {/* Ledger Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <TextReveal
            as="h1"
            delayMs={60}
            durationMs={750}
            yOffset={14}
            className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Transaction Ledger
          </TextReveal>
          <TextReveal
            as="p"
            delayMs={220}
            durationMs={800}
            yOffset={12}
            className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
          >
            Complete multi-tenant audit trail with instant keyboard search and category filtering
          </TextReveal>
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
        pageSize={limit}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
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
        onCategoryCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }}
        categories={categories}
        transactionToEdit={transactionToEdit}
      />
      {/* Sleek Floating Scroll-To-Top Button */}
      <ScrollToTop />
    </main>
  );
}
