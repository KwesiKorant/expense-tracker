"use client";

import React from "react";

interface TextRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  yOffset?: number;
  scale?: number;
  className?: string;
  as?: React.ElementType;
}

/**
 * TextReveal Primitive — 120 FPS Compositor Standard
 * Executes text appearance strictly on the GPU compositor thread using native CSS keyframes.
 * Zero reflow, zero repaint, zero main-thread layout thrashing.
 */
export function TextReveal({
  children,
  delayMs = 0,
  durationMs = 380,
  yOffset = 8,
  scale = 0.98,
  className = "",
  as: Component = "span",
}: TextRevealProps) {
  const style: React.CSSProperties & Record<string, string> = {
    "--reveal-delay": `${delayMs}ms`,
    "--reveal-duration": `${durationMs}ms`,
    "--reveal-y": `${yOffset}px`,
    "--reveal-scale": `${scale}`,
  };

  const isBlockElement =
    Component === "h1" ||
    Component === "h2" ||
    Component === "h3" ||
    Component === "p" ||
    Component === "div" ||
    className.includes("block") ||
    className.includes("flex");

  return (
    <Component
      style={style}
      className={`text-reveal-item ${isBlockElement ? "block" : "inline-block"} ${className}`}
    >
      {children}
    </Component>
  );
}
