"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * Zero-FOUC ThemeToggle Primitive — Arc-AA Standard
 * Uses useSyncExternalStore to eliminate hydration flashes while providing
 * instant Light / Dark / System tri-theme switching.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <div className={`h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse ${className}`} />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (theme === "dark") return <Moon className="w-4 h-4 text-indigo-400" />;
    if (theme === "light") return <Sun className="w-4 h-4 text-amber-500" />;
    return <Laptop className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-colors cursor-pointer ${className}`}
      title={`Current theme: ${theme || "system"}. Click to cycle.`}
      aria-label="Toggle visual theme"
    >
      {getIcon()}
    </button>
  );
}
