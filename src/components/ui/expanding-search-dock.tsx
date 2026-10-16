"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExpandingSearchDockProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * ExpandingSearchDock Primitive — 120 FPS FLIP Morphing Standard
 * - Inactive: Circular rounded icon button (w-9 h-9 rounded-full).
 * - Active: Smoothly morphs horizontally into an institutional search bar (w-64 sm:w-80 h-9 rounded-full).
 * - Zero layout thrashing: Handled via Framer Motion FLIP transform matrix.
 * - Global shortcuts: `/` or `⌘K` triggers instantaneous expansion and focus.
 */
export function ExpandingSearchDock({
  value,
  onChange,
  placeholder = "Search transactions...",
  className = "",
}: ExpandingSearchDockProps) {
  const [isOpen, setIsOpen] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global keybinding listener for '/' and '⌘K' / 'Ctrl+K'
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      } else if (e.key === "Escape" && isOpen) {
        if (!value) {
          setIsOpen(false);
        } else {
          onChange("");
          setIsOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, value, onChange]);

  // Click outside listener: collapse if search input is empty
  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !value
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen && !value) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen, value]);

  const handleOpen = () => {
    setIsOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const isExpanded = isOpen || Boolean(value);

  return (
    <motion.div
      layout
      ref={containerRef}
      transition={{ type: "spring", stiffness: 450, damping: 32 }}
      className={`relative flex items-center shrink-0 ${
        isExpanded
          ? "w-64 sm:w-72 h-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 shadow-sm ring-2 ring-zinc-950/5 dark:ring-zinc-100/5"
          : "w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-90 shadow-sm"
      } ${className}`}
      onClick={!isExpanded ? handleOpen : undefined}
      role={!isExpanded ? "button" : undefined}
      aria-label={!isExpanded ? "Search transactions (⌘K)" : undefined}
      title={!isExpanded ? "Search transactions (⌘K)" : undefined}
    >
      <motion.div layout className="flex items-center shrink-0">
        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center w-full pl-2 overflow-hidden"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            {value ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md active:scale-90 transition-transform cursor-pointer shrink-0 ml-1"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 shrink-0 ml-1 select-none">
                ESC
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
