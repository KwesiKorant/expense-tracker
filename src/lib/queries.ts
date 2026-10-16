/**
 * Institutional Data Queries & Prefetch Primitives
 * Provides unified TanStack Query keys, fetch functions, and proactive
 * pre-warming helpers for instant 0ms tab switching between Overview and Ledger.
 */

export interface LedgerQueryParams {
  page: number;
  limit: number;
  search: string;
  selectedType: string;
  selectedCategory: string;
  showArchived: boolean;
}

export const defaultLedgerParams: LedgerQueryParams = {
  page: 1,
  limit: 10,
  search: "",
  selectedType: "",
  selectedCategory: "",
  showArchived: false,
};

export const queryKeys = {
  categories: ["categories"] as const,
  analyticsSummary: ["analytics", "summary"] as const,
  recentTransactions: ["transactions", "recent"] as const,
  ledgerTransactions: (params: LedgerQueryParams = defaultLedgerParams) =>
    ["transactions", params] as const,
};

export async function fetchCategories() {
  const res = await fetch("/api/v1/categories");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data.categories;
}

export async function fetchAnalyticsSummary() {
  const res = await fetch("/api/v1/analytics/summary");
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export async function fetchRecentTransactions() {
  const res = await fetch("/api/v1/transactions?page=1&limit=5&isArchived=false");
  if (!res.ok) throw new Error("Failed to load recent transactions");
  const data = await res.json();
  return data.data;
}

export async function fetchLedgerTransactions(params: LedgerQueryParams = defaultLedgerParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit || 10));
  if (params.search) searchParams.set("search", params.search);
  if (params.selectedType) searchParams.set("type", params.selectedType);
  if (params.selectedCategory) searchParams.set("categoryId", params.selectedCategory);
  searchParams.set("isArchived", String(params.showArchived));

  const res = await fetch(`/api/v1/transactions?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to load transactions");
  const data = await res.json();
  return data.data;
}
