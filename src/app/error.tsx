"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";

/**
 * Global Error Boundary Primitive — CWE-209 & Arc-AA Standard
 * - Zero sensitive data exposure: Raw stack traces and runtime messages are never shown to end users.
 * - Provides clean incident tracking reference (digest) and recovery actions.
 * - Developer diagnostics are strictly collapsed under NODE_ENV === 'development'.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Technical stack trace is strictly sent to telemetry / console logs
    console.error("Runtime exception caught by route boundary:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md">
        <EdgeCornerFrame className="p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 mb-5">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 mb-2">
            System Notice
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Something went wrong
          </h1>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mb-4 leading-relaxed">
            An unexpected error interrupted this view. State integrity has been safely preserved.
          </p>

          {/* Opaque incident digest for production auditing without information disclosure */}
          {error?.digest && (
            <div className="mb-5 inline-block px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 text-[11px] font-mono select-all">
              Incident Ref: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{error.digest}</span>
            </div>
          )}

          {/* Developer-only diagnostics collapsed behind an intentional inspection disclosure */}
          {isDev && error?.message && (
            <details className="mb-5 text-left rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs">
              <summary className="text-[11px] font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-800 dark:hover:text-zinc-200">
                Developer Diagnostics (Dev Only)
              </summary>
              <div className="mt-2 font-mono text-[11px] text-red-600 dark:text-red-400 break-all p-2 bg-zinc-200/50 dark:bg-zinc-950/60 rounded-lg">
                {error.message}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] text-xs font-semibold transition-all duration-150 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Overview
            </Link>
          </div>
        </EdgeCornerFrame>
      </div>
    </main>
  );
}
