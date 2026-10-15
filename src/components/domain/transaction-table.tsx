"use client";

import React, { useState } from "react";
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
  isLoading = false,
}: TransactionTableProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const toast = useToast();

  const handleAction = async (id: string, action: "archive" | "restore") => {
    setActingId(id);
    try {
      if (action === "archive") {
        await onArchive(id);
        toast.success("Transaction archived", "Record moved to archived ledger view.");
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
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] text-xs font-medium shadow-sm transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          {/* Quick-Add Transaction */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
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
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
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
                  ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm"
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
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
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
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
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
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    Updating ledger stream...
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <FileSpreadsheet className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-medium text-zinc-600 dark:text-zinc-300">
                      No matching records found
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Adjust your active filters or record a new transaction.
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
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer shadow-sm"
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
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${tx.category?.color || "#6366f1"}15`,
                        color: tx.category?.color || "#6366f1",
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      {tx.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-mono tracking-tight font-semibold ${
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600/90 dark:text-rose-400/90"
                      }`}
                    >
                      {tx.type === "INCOME" ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{formatCurrency(tx.amount)}
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5 opacity-80" />
                          -{formatCurrency(tx.amount)}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    {tx.isArchived ? (
                      <button
                        type="button"
                        disabled={actingId === tx.id}
                        onClick={() => handleAction(tx.id, "restore")}
                        className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10 active:scale-90 hover:scale-105 transition-all cursor-pointer"
                        title="Restore to active ledger"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actingId === tx.id}
                        onClick={() => handleAction(tx.id, "archive")}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 active:scale-90 hover:scale-105 transition-all cursor-pointer"
                        title="Soft-archive transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
    </EdgeCornerFrame>
  );
}
