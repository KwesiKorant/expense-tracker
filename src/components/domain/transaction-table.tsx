"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Plus,
  Trash2,
  RotateCcw,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Archive,
  Receipt,
  AlertTriangle,
  X,
  Loader2,
  Pencil,
} from "lucide-react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock";
import { useToast } from "@/components/ui/toast";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: string;
}

export interface TransactionItem {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  description: string;
  isArchived: boolean;
  category: Category;
}

interface TransactionTableProps {
  transactions: TransactionItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  categories: Category[];
  search: string;
  onSearchChange: (search: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (catId: string) => void;
  showArchived: boolean;
  onToggleArchived: (val: boolean) => void;
  onOpenAddModal: () => void;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete?: (id: string) => Promise<void>;
  onEdit?: (tx: TransactionItem) => void;
  isLoading?: boolean;
}

export function TransactionTable({
  transactions,
  total,
  page,
  totalPages,
  onPageChange,
  categories,
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  showArchived,
  onToggleArchived,
  onOpenAddModal,
  onArchive,
  onRestore,
  onPermanentDelete,
  onEdit,
  isLoading = false,
}: TransactionTableProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const [purgeCandidate, setPurgeCandidate] = useState<TransactionItem | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const toast = useToast();

  const handleConfirmPurge = async () => {
    if (!purgeCandidate || !onPermanentDelete) return;
    setIsPurging(true);
    try {
      await onPermanentDelete(purgeCandidate.id);
      toast.success(
        "Transaction permanently purged",
        `"${purgeCandidate.description}" was completely removed from the database.`
      );
      setPurgeCandidate(null);
    } catch {
      toast.error("Purge failed", "Could not permanently delete transaction.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleAction = async (id: string, action: "archive" | "restore", txDescription?: string) => {
    setActingId(id);
    try {
      if (action === "archive") {
        await onArchive(id);
        toast.info("Transaction archived", {
          description: txDescription || "Record moved to archived ledger view.",
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                await onRestore(id);
                toast.success("Transaction restored", "Record returned to active ledger.");
              } catch {
                toast.error("Restoration failed", "Could not restore transaction.");
              }
            },
          },
          durationMs: 5000,
        });
      } else {
        await onRestore(id);
        toast.success("Transaction restored", "Record returned to active calculations.");
      }
    } catch {
      toast.error("Action failed", "Unable to update transaction state.");
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const hasActiveFilters = Boolean(search || selectedType || selectedCategory);
  const isOnboardingEmpty = total === 0 && !hasActiveFilters && !showArchived;
  const isArchiveEmpty = transactions.length === 0 && showArchived && !hasActiveFilters;
  const isFilterMiss = transactions.length === 0;

  return (
    <EdgeCornerFrame className="p-5">
      {/* Table Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Ledger Entries
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Realtime multi-tenant ledger with audit immutability
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <a
            href="/api/v1/transactions/export"
            download="transactions-export.csv"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] text-xs font-medium transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          {/* Quick-Add Transaction */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {/* Type Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs shrink-0">
            <button
              type="button"
              onClick={() => onTypeChange("")}
              className={`px-3 py-1 rounded-lg font-medium active:scale-95 transition-all duration-150 cursor-pointer ${
                selectedType === ""
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onTypeChange("EXPENSE")}
              className={`px-3 py-1 rounded-lg font-medium active:scale-95 transition-all duration-150 cursor-pointer ${
                selectedType === "EXPENSE"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => onTypeChange("INCOME")}
              className={`px-3 py-1 rounded-lg font-medium active:scale-95 transition-all duration-150 cursor-pointer ${
                selectedType === "INCOME"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Income
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 shrink-0"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>

          {/* Archive Toggle Pill */}
          <button
            type="button"
            onClick={() => onToggleArchived(!showArchived)}
            className={`h-9 px-3 rounded-xl border text-xs font-medium active:scale-95 transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
              showArchived
                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {showArchived ? "Archived Ledger" : "Active Ledger"}
          </button>
        </div>

        {/* Expanding Search Dock */}
        <ExpandingSearchDock
          value={search}
          onChange={onSearchChange}
          placeholder="Search by keywords..."
          className="w-full sm:w-auto"
        />
      </div>

      {/* Empty States (Rendered symmetrically across mobile and desktop) */}
      {isOnboardingEmpty ? (
        <div className="py-14 text-center text-zinc-400">
          <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 mb-1">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
              Your Ledger is Empty
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You have not recorded any financial transactions yet. Start tracking by logging your first transaction.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all duration-150 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Record First Entry
            </button>
          </div>
        </div>
      ) : isArchiveEmpty ? (
        <div className="py-14 text-center text-zinc-400">
          <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 mb-1">
              <Archive className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
              No Archived Transactions
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Soft-deleted records are securely stored here for audit compliance and can be restored at any time.
            </p>
            <button
              type="button"
              onClick={() => onToggleArchived(false)}
              className="mt-2 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer border border-zinc-200 dark:border-zinc-700"
            >
              Switch to Active Ledger
            </button>
          </div>
        </div>
      ) : isFilterMiss ? (
        <div className="py-14 text-center text-zinc-400">
          <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 mb-1">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
              No Matching Records
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {search ? `Zero records found matching "${search}".` : "No records match your active category or type filters."}
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onTypeChange("");
                onCategoryChange("");
                onToggleArchived(false);
                onPageChange(1);
              }}
              className="mt-2 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer border border-zinc-200 dark:border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Active Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Desktop & Tablet Institutional Tabular Grid (>= 768px) */}
          <div className="hidden md:block overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800/40">
                      <td className="py-4 px-3">
                        <div className="w-20 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="w-48 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="w-24 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="w-20 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" />
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td
                        className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] md:max-w-xs lg:max-w-md truncate cursor-pointer hover:underline underline-offset-2"
                        title={tx.description}
                        onClick={() => onEdit?.(tx)}
                      >
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60">
                          <Tag className="w-3 h-3 text-zinc-400" />
                          {tx.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-mono tracking-tight ${
                            tx.type === "INCOME"
                              ? "text-zinc-950 dark:text-zinc-50 font-bold"
                              : "text-zinc-500 dark:text-zinc-400 font-medium"
                          }`}
                        >
                          {tx.type === "INCOME" ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-50" />
                              +{formatCurrency(tx.amount)}
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-zinc-400" />
                              -{formatCurrency(tx.amount)}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {tx.isArchived ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={actingId === tx.id}
                              onClick={() => handleAction(tx.id, "restore")}
                              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
                              title="Restore to active ledger"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            {onPermanentDelete && (
                              <button
                                type="button"
                                disabled={actingId === tx.id}
                                onClick={() => setPurgeCandidate(tx)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
                                title="Delete forever (permanent purge)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {onEdit && (
                              <button
                                type="button"
                                disabled={actingId === tx.id}
                                onClick={() => onEdit(tx)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
                                title="Edit transaction"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={actingId === tx.id}
                              onClick={() => handleAction(tx.id, "archive", tx.description)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 hover:scale-105 transition-all cursor-pointer"
                              title="Soft-archive transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile High-Density Ledger Cards (< 768px, Zero Horizontal Scroll) */}
          <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 -mx-5 px-5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="py-3.5 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="w-20 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="w-24 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              ))
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex flex-col gap-2 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          tx.type === "INCOME"
                            ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-zinc-200"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {tx.type === "INCOME" ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div
                        className="min-w-0 cursor-pointer"
                        title={tx.description}
                        onClick={() => onEdit?.(tx)}
                      >
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate hover:underline underline-offset-2">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-zinc-400">
                            {formatDate(tx.date)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                            <Tag className="w-2.5 h-2.5 text-zinc-400" />
                            {tx.category?.name || "Uncategorized"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-mono tracking-tight ${
                          tx.type === "INCOME"
                            ? "text-zinc-950 dark:text-zinc-50 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 font-semibold"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Quick Action Buttons Bar */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    {tx.isArchived ? (
                      <>
                        <button
                          type="button"
                          disabled={actingId === tx.id}
                          onClick={() => handleAction(tx.id, "restore")}
                          className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        {onPermanentDelete && (
                          <button
                            type="button"
                            disabled={actingId === tx.id}
                            onClick={() => setPurgeCandidate(tx)}
                            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Purge
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onEdit && (
                          <button
                            type="button"
                            disabled={actingId === tx.id}
                            onClick={() => onEdit(tx)}
                            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={actingId === tx.id}
                          onClick={() => handleAction(tx.id, "archive", tx.description)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Archive
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all duration-150 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all duration-150 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Permanent Purge Confirmation Modal */}
      <AnimatePresence>
        {purgeCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPurging && setPurgeCandidate(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="purge-modal-title"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setPurgeCandidate(null)}
                  disabled={isPurging}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 id="purge-modal-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-4">
                Permanently delete transaction?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                This entry and its audit records will be irreversibly expunged from your database. This action cannot be undone.
              </p>

              {/* Transaction Summary Card */}
              <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
                <div className="pr-3 truncate">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {purgeCandidate.description}
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    {formatDate(purgeCandidate.date)} · {purgeCandidate.category?.name || "Uncategorized"}
                  </p>
                </div>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {purgeCandidate.type === "INCOME" ? "+" : "-"}{formatCurrency(purgeCandidate.amount)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPurgeCandidate(null)}
                  disabled={isPurging}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurge}
                  disabled={isPurging}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-200 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isPurging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Purging...
                    </>
                  ) : (
                    "Delete Forever"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </EdgeCornerFrame>
  );
}
