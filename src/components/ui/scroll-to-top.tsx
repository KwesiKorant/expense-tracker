"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  sentinelId?: string;
  className?: string;
}

/**
 * ScrollToTopSentinel Primitive
 * Place at the top of scrollable page layouts.
 * Zero-layout, zero-paint sentinel observed by IntersectionObserver to eliminate
 * unthrottled main-thread scroll event listeners.
 */
export function ScrollToTopSentinel({
  id = "page-top-sentinel",
}: {
  id?: string;
}) {
  return (
    <div
      id={id}
      aria-hidden="true"
      className="absolute top-0 left-0 w-full h-32 pointer-events-none -z-10 opacity-0 select-none"
    />
  );
}

/**
 * ScrollToTop Button Primitive — 120 FPS Compositor & Emil Kowalski Standard
 * - Zero-scroll listener: Driven strictly by IntersectionObserver.
 * - Hardware-accelerated entrance and exit via transform & opacity.
 * - Spring physics: stiffness 420, damping 28.
 * - Reduced-motion aware: falls back to instantaneous jump if requested by system.
 */
export function ScrollToTop({
  sentinelId = "page-top-sentinel",
  className = "",
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const target = document.getElementById(sentinelId);

    if (target && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(!entry.isIntersecting);
        },
        {
          root: null, // viewport
          threshold: 0,
        }
      );
      observer.observe(target);
    } else {
      // Passive, RAF-throttled fallback if sentinel is not detected
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            setIsVisible(window.scrollY > 250);
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [sentinelId]);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="scroll-to-top"
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll smoothly back to top of page"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={`group fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full border border-zinc-200/90 dark:border-zinc-800 glass-pill shadow-lg shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-850 active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${className}`}
        >
          <ArrowUp className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-tight pr-0.5 select-none">
            Top
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
