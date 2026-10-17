"use client";

import React, { useRef, useEffect } from "react";

interface TextRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  yOffset?: number;
  scale?: number;
  className?: string;
  as?: React.ElementType;
}

// Module-level singleton IntersectionObserver to avoid creating multiple observer instances.
// Directly mutates DOM classList to prevent React component re-render cascades during scroll.
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add("text-revealed");
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -20px 0px", // triggers slightly before full bottom entry
        threshold: 0.05,
      }
    );
  }
  return sharedObserver;
}

/**
 * TextReveal Primitive — 120 FPS Compositor Standard with Viewport Gating
 * Executes text appearance strictly on the GPU compositor thread using native CSS keyframes
 * when the element scrolls into view.
 * Zero reflow, zero repaint, zero main-thread layout thrashing, zero React re-renders.
 */
export function TextReveal({
  children,
  delayMs = 0,
  durationMs = 720,
  yOffset = 14,
  scale = 0.98,
  className = "",
  as: Component = "span",
}: TextRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IntersectionObserver is unavailable, immediately reveal
    const observer = getSharedObserver();
    if (!observer) {
      el.classList.add("text-revealed");
      return;
    }

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, []);

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
      ref={ref}
      style={style}
      className={`text-reveal-item ${isBlockElement ? "block" : "inline-block"} ${className}`}
    >
      {children}
    </Component>
  );
}
