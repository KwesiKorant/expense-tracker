"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  align?: "left" | "right" | "auto";
  matchTriggerWidth?: boolean;
}

/**
 * CustomDropdown Primitive — Arc-AA & Emil Kowalski Design Language Standard
 * Replaces native HTML selects with institutional glassmorphic popovers.
 * Features:
 * - Responsive screen adaptation & collision detection (flips horizontal/vertical alignment at viewport boundaries)
 * - Full-width form and compact toolbar modes
 * - 60/120 FPS compositor physics via Framer Motion spring curves
 * - Mobile overscroll containment & touch-friendly ergonomics
 * - Full ARIA combobox/listbox accessibility and keyboard navigation
 */
export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  size = "sm",
  className = "",
  ariaLabel,
  disabled = false,
  align = "auto",
  matchTriggerWidth,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [horizontalAlign, setHorizontalAlign] = useState<"left" | "right">("left");
  const [verticalPlacement, setVerticalPlacement] = useState<"bottom" | "top">("bottom");
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const isFullWidth = matchTriggerWidth || className.includes("w-full");
  const isSmall = size === "sm";

  const selectedOption = options.find((opt) => opt.value === value);

  // Responsive Collision & Viewport Boundary Detection
  const computePlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal placement
    if (isFullWidth) {
      setHorizontalAlign("left");
    } else if (align !== "auto") {
      setHorizontalAlign(align);
    } else {
      const estimatedWidth = 260;
      const spaceOnRight = viewportWidth - rect.left;
      const spaceOnLeft = rect.right;

      // If expanding rightwards will bleed past right viewport edge, but expanding leftwards fits:
      if (spaceOnRight < estimatedWidth && spaceOnLeft >= estimatedWidth) {
        setHorizontalAlign("right");
      } else {
        setHorizontalAlign("left");
      }
    }

    // Vertical placement (flip upward if close to viewport bottom or virtual keyboard)
    const estimatedHeight = 240;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setVerticalPlacement("top");
    } else {
      setVerticalPlacement("bottom");
    }
  }, [align, isFullWidth]);

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      computePlacement();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleWindowChange = () => {
      computePlacement();
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);
    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [isOpen, computePlacement]);

  // Close on outside pointer click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        computePlacement();
        setIsOpen(true);
        return;
      }

      const currentIndex = options.findIndex((opt) => opt.value === value);
      let nextIndex = currentIndex;

      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }

      if (options[nextIndex]) {
        onChange(options[nextIndex].value);
      }
    }
  };

  // Popover positioning and sizing classes
  const placementClasses =
    verticalPlacement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";

  const alignmentClasses = isFullWidth
    ? "left-0 right-0 w-full min-w-full"
    : horizontalAlign === "right"
      ? "right-0 left-auto w-max min-w-full max-w-[min(280px,calc(100vw-1.5rem))]"
      : "left-0 right-auto w-max min-w-full max-w-[min(280px,calc(100vw-1.5rem))]";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${isOpen ? "z-40" : "z-10"} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        className={`btn-tactile w-full flex items-center justify-between gap-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${
          isSmall
            ? "h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 font-medium"
            : "h-11 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
        } ${isOpen ? "ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 border-zinc-400 dark:border-zinc-600" : ""}`}
      >
        <span className="truncate flex-1 text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ease-out ${
            isSmall ? "w-3.5 h-3.5" : "w-4 h-4"
          } ${isOpen ? "rotate-180 text-zinc-700 dark:text-zinc-200" : "rotate-0"}`}
        />
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, scale: 0.96, y: verticalPlacement === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: verticalPlacement === "top" ? 4 : -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`absolute ${placementClasses} ${alignmentClasses} z-50 rounded-xl glass-panel border border-zinc-200/90 dark:border-zinc-800 shadow-xl shadow-zinc-950/10 dark:shadow-black/60 p-1 overflow-x-hidden max-h-60 overflow-y-auto overscroll-contain [scrollbar-width:thin]`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg cursor-pointer transition-colors duration-150 select-none ${
                    isSmall ? "text-xs" : "text-sm"
                  } ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                  }`}
                >
                  <span className="truncate flex-1">{opt.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {opt.sublabel && (
                      <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {opt.sublabel}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
