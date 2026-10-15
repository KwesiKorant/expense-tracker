"use client";

import React from "react";

interface EdgeCornerFrameProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "indigo" | "emerald" | "amber" | "rose" | "zinc";
  interactive?: boolean;
}

const GLOW_COLORS = {
  indigo: "from-indigo-500/15 dark:from-indigo-500/20",
  emerald: "from-emerald-500/15 dark:from-emerald-500/20",
  amber: "from-amber-500/15 dark:from-amber-500/20",
  rose: "from-rose-500/15 dark:from-rose-500/20",
  zinc: "from-zinc-500/10 dark:from-zinc-500/15",
};

/**
 * EdgeCornerFrame Primitive — Cardless Dimensional Framing
 * Replaces harsh, heavy borders with subtle optical corner diffusion gradients.
 * Uses hardware-accelerated transforms and opacity for interactive hovering without reflows.
 */
export function EdgeCornerFrame({
  children,
  className = "",
  glowColor = "zinc",
  interactive = false,
}: EdgeCornerFrameProps) {
  const glow = GLOW_COLORS[glowColor];

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        interactive
          ? "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          : ""
      } ${className}`}
    >
      {/* Top-Left Optical Corner Accent */}
      <div
        className={`pointer-events-none absolute -top-px -left-px h-16 w-16 md:h-24 md:w-24 rounded-tl-2xl bg-radial to-transparent ${glow} opacity-60 dark:opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />

      {/* Bottom-Right Optical Corner Accent */}
      <div
        className={`pointer-events-none absolute -bottom-px -right-px h-16 w-16 md:h-24 md:w-24 rounded-br-2xl bg-radial to-transparent ${glow} opacity-40 dark:opacity-60 transition-opacity duration-300 group-hover:opacity-90`}
        aria-hidden="true"
      />

      {/* Inner Relative Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
