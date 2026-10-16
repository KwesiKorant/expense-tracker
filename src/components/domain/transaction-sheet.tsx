"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { useMobileSheetDrag } from "@/hooks/use-mobile-sheet-drag";
import { useToast } from "@/components/ui/toast";

export interface CategoryOption {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

export interface TransactionToEdit {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
}

interface TransactionSheetFormProps {
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
  transactionToEdit?: TransactionToEdit | null;
}

function TransactionSheetForm({
  onClose,
  onSuccess,
  categories,
  transactionToEdit,
}: TransactionSheetFormProps) {
  const toast = useToast();
  const isEditing = Boolean(transactionToEdit);

  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    transactionToEdit?.type || "EXPENSE"
  );
  const [amount, setAmount] = useState(
    transactionToEdit ? String(transactionToEdit.amount) : ""
  );
  const [amountError, setAmountError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    transactionToEdit?.category?.id || ""
  );
  const [date, setDate] = useState(
    transactionToEdit
      ? typeof transactionToEdit.date === "string"
        ? transactionToEdit.date.slice(0, 10)
        : new Date(transactionToEdit.date).toISOString().slice(0, 10)
      : "2026-10-15"
  );
  const [description, setDescription] = useState(
    transactionToEdit?.description || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (!val) {
      setAmountError("");
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      setAmountError("Please enter a numeric amount.");
    } else if (num <= 0) {
      setAmountError("Amount must be greater than $0.00.");
    } else if (val.includes(".") && val.split(".")[1]?.length > 2) {
      setAmountError("Maximum of two decimal places allowed.");
    } else {
      setAmountError("");
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);
  const activeCategoryId =
    selectedCategoryId && filteredCategories.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : filteredCategories[0]?.id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Please enter a valid amount greater than zero.");
      return;
    }

    if (amount.includes(".") && amount.split(".")[1]?.length > 2) {
      setAmountError("Maximum of two decimal places allowed.");
      return;
    }

    if (!activeCategoryId) {
      setErrorMsg("Please select a category.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Please enter a brief description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/v1/transactions/${transactionToEdit!.id}`
        : "/api/v1/transactions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          categoryId: activeCategoryId,
          date,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEditing ? "update" : "record"} transaction.`);
      }

      toast.success(
        isEditing ? "Transaction updated" : "Transaction recorded",
        `Successfully saved $${parsedAmount.toFixed(2)} (${type.toLowerCase()})`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {isEditing ? "Edit Transaction" : "Record Transaction"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg active:scale-90 transition-all cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setSelectedCategoryId("");
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer ${
              type === "EXPENSE"
                ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setSelectedCategoryId("");
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer ${
              type === "INCOME"
                ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base font-medium">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              required
              className={`w-full h-11 pl-8 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border ${
                amountError
                  ? "border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900/20 dark:ring-zinc-100/20"
                  : "border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100"
              } text-zinc-900 dark:text-zinc-100 font-semibold text-base focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10`}
            />
          </div>
          {amountError && (
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1">
              <span>*</span> {amountError}
            </p>
          )}
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Category
          </label>
          <select
            value={activeCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
          >
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Weekly supermarket shopping"
            maxLength={255}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-200 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEditing ? "Updating Transaction..." : "Recording Transaction..."}
            </>
          ) : (
            isEditing ? "Update Transaction" : "Record Transaction"
          )}
        </button>
      </form>
    </>
  );
}

export interface TransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
  transactionToEdit?: TransactionToEdit | null;
}

export function TransactionSheet({
  isOpen,
  onClose,
  onSuccess,
  categories,
  transactionToEdit,
}: TransactionSheetProps) {
  const { isMobile, backdropOpacity, dragProps } = useMobileSheetDrag(onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Kinematic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal / Draggable Sheet */}
          <motion.div
            {...dragProps}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 10 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="flex justify-center -mt-2 mb-4">
                <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>
            )}

            <TransactionSheetForm
              key={transactionToEdit?.id ?? "new"}
              onClose={onClose}
              onSuccess={onSuccess}
              categories={categories}
              transactionToEdit={transactionToEdit}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
