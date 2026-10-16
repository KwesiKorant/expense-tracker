import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 glass-header">
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

      {/* Main Skeleton Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Strip Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="w-28 h-7 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-24 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 h-[360px] space-y-4">
            <div className="w-48 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-full h-[260px] rounded-xl bg-zinc-100 dark:bg-zinc-900/60 animate-pulse" />
          </div>
          <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 h-[360px] space-y-4">
            <div className="w-36 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-zinc-200 dark:border-zinc-800 animate-pulse mt-8" />
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-24 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="w-40 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="w-20 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800/60 animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
