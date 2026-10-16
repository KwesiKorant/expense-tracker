"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
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
 * Zero-FOUC Kinetic ThemeToggle Primitive — Arc-AA Standard
 * Combines useSyncExternalStore with 180° spring icon rotation and tactile scale feedback.
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
      className={`btn-tactile relative inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 overflow-hidden cursor-pointer ${className}`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle visual theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ rotate: -90, scale: 0.75, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.75, opacity: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-zinc-100" />
          ) : (
            <Sun className="w-4 h-4 text-zinc-900" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
