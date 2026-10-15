"use client";

import React from "react";

interface EdgeCornerFrameProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "indigo" | "emerald" | "amber" | "rose" | "zinc";
  interactive?: boolean;
}

/**
 * EdgeCornerFrame Primitive — Minimalist Monochromatic Framing
 * Pure zero-shadow, zero-glow architectural borders with high-performance compositor rendering.
 */
export function EdgeCornerFrame({
  children,
  className = "",
  interactive = false,
}: EdgeCornerFrameProps) {
  return (
    <div
      className={`relative rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 transition-colors duration-150 ${
        interactive
          ? "hover:border-zinc-400 dark:hover:border-zinc-600"
          : ""
      } ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
