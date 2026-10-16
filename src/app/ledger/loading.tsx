import React from "react";

export default function LedgerLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-28 h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="w-36 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="space-y-1.5">
            <div className="w-48 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-80 h-3 rounded bg-zinc-200 dark:bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-24 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* Table Frame Skeleton */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 space-y-5">
          {/* Controls row skeleton */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-24 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-24 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Shimmer Rows */}
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800/40"
              >
                <div className="w-20 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-44 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-24 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-20 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
