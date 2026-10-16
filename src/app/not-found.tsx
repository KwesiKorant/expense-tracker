import React from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md">
        <EdgeCornerFrame className="p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 mb-5">
            <FileQuestion className="w-6 h-6" />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 mb-2">
            HTTP 404
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Page Not Found
          </h1>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mb-6">
            The ledger record or navigation route you requested does not exist or has been relocated.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Overview
            </Link>

            <Link
              href="/ledger"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] text-xs font-semibold transition-all duration-150 cursor-pointer"
            >
              Open Ledger
            </Link>
          </div>
        </EdgeCornerFrame>
      </div>
    </main>
  );
}
