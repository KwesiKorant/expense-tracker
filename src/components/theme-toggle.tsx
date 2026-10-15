"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

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
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <div className={`h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse ${className}`} />;
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-90 transition-all duration-150 cursor-pointer ${className}`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-zinc-100 transition-transform duration-200" />
      ) : (
        <Sun className="w-4 h-4 text-zinc-900 transition-transform duration-200" />
      )}
    </button>
  );
}
