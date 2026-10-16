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
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Ledger Entries
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal">
              {total} records
            </span>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
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
            className="h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400"
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
            className={`h-9 px-3 rounded-xl border text-xs font-medium active:scale-95 transition-all duration-150 cursor-pointer ${
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
        />
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto -mx-5 px-5">
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
            ) : isOnboardingEmpty ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-zinc-400">
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
                </td>
              </tr>
            ) : isArchiveEmpty ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-zinc-400">
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
                </td>
              </tr>
            ) : isFilterMiss ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-zinc-400">
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
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="py-3.5 px-3 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
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
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all duration-150 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 transition-all duration-150 cursor-pointer"
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
