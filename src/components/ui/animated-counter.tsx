"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  formatAsCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  animateOnMount?: boolean;
}

/**
 * AnimatedCounter Primitive — 120 FPS Compositor-Grade Tabular Counter
 * Directly interpolates textContent on live data changes without initial-mount count-up jitter.
 * Locked with `tabular-nums` to eliminate layout jitter and visual width shifts.
 */
export function AnimatedCounter({
  value,
  durationMs = 460,
  decimals = 2,
  formatAsCurrency = true,
  prefix = "",
  suffix = "",
  className = "",
  animateOnMount = false,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(animateOnMount ? 0 : value);
  const isFirstMountRef = useRef<boolean>(true);
  const rafRef = useRef<number | null>(null);

  const format = useCallback(
    (val: number) => {
      if (formatAsCurrency) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
      }
      return `${prefix}${val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    },
    [decimals, formatAsCurrency, prefix, suffix]
  );

  useEffect(() => {
    if (!spanRef.current) return;

    // Handle initial mount stability
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (!animateOnMount) {
        prevValueRef.current = value;
        spanRef.current.textContent = format(value);
        return;
      }
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const startVal = prevValueRef.current;
    const endVal = value;

    if (prefersReducedMotion || startVal === endVal) {
      prevValueRef.current = endVal;
      spanRef.current.textContent = format(endVal);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      if (!spanRef.current) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Strong cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      spanRef.current.textContent = format(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        spanRef.current.textContent = format(endVal);
        prevValueRef.current = endVal;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, durationMs, format, animateOnMount]);

  return (
    <span
      ref={spanRef}
      className={`font-mono tabular-nums tracking-tight inline-block ${className}`}
    >
      {format(value)}
    </span>
  );
}
