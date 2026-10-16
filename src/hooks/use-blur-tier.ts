"use client";

import { useSyncExternalStore, useCallback } from "react";

export type BlurTier = "high" | "low";

function evaluateTier(): BlurTier {
  if (typeof window === "undefined") return "high";

  // 1. Accessibility override: OS Reduce Transparency
  if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
    return "low";
  }

  // 2. Data Saver mode
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) {
    return "low";
  }

  // 3. Hardware Concurrency check (budget or heavily throttled chips have < 4 cores)
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4) {
    return "low";
  }

  // 4. Device Memory check (Chromium API: devices with < 4GB RAM)
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem < 4) {
    return "low";
  }

  return "high";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const mql = window.matchMedia("(prefers-reduced-transparency: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): BlurTier {
  const current = evaluateTier();
  if (typeof document !== "undefined" && document.documentElement.dataset.blurTier !== current) {
    document.documentElement.dataset.blurTier = current;
  }
  return current;
}

function getServerSnapshot(): BlurTier {
  return "high";
}

/**
 * useBlurTier Hook — Separation Tier Architecture Standard
 * 
 * Capability Tiers:
 * - "high": Modern devices with hardware-accelerated GPU pipelines. Renders true backdrop-filter: blur().
 * - "low": Budget CPUs (<4 cores), constrained memory (<4GB RAM), Data Saver active, or OS Reduce Transparency.
 *          Renders the lightweight zero-GPU mimic (high-density surface tint + crisp micro-border).
 */
export function useBlurTier() {
  const tier = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTier = useCallback((newTier: BlurTier) => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.blurTier = newTier;
    }
  }, []);

  return {
    tier,
    isHighTier: tier === "high",
    isLowTier: tier === "low",
    setTier,
  };
}
