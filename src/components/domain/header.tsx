"use client";

import React from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  activeTab: "overview" | "ledger";
  onOpenAddModal?: () => void;
  userProfile?: { fullName: string; email: string } | null;
  onLogout: () => void;
}

/**
 * Institutional Header Navigation Component
 * Provides instant zero-layout-shift routing between Overview and Ledger,
 * user identity presentation, theme toggle, and session logout.
 */
export function Header({
  activeTab,
  userProfile,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-sm border border-zinc-800 dark:border-zinc-200 transition-transform duration-150 group-active:scale-95">
              ET
            </div>
            <span className="hidden sm:inline font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              Expense Tracker
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs" aria-label="Main Navigation">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Overview
            </Link>
            <Link
              href="/ledger"
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Ledger
            </Link>
          </nav>
        </div>

        {/* Right: Identity, Theme, Logout */}
        <div className="flex items-center gap-2.5">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                {userProfile.fullName}
              </span>
            </div>
          )}

          <ThemeToggle />

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 active:scale-90 transition-all duration-150 cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
