"use client";

import { useSyncExternalStore } from "react";
import { useMotionValue, useTransform, useDragControls, type PanInfo } from "motion/react";

function subscribeMediaQuery(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(max-width: 639px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsMobileSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

function getIsMobileServerSnapshot(): boolean {
  return false;
}

/**
 * useMobileSheetDrag Hook — Arc-AA Compositor Standard
 * Provides touch drag-to-dismiss mechanics on mobile viewports (< 640px)
 * while gracefully preserving centered dialog mechanics on desktop (>= 640px).
 * Restricts drag-to-dismiss to the dedicated grab handle & header area via dragControls.
 */
export function useMobileSheetDrag(onDismiss: () => void) {
  const isMobile = useSyncExternalStore(
    subscribeMediaQuery,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );

  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 240], [1, 0]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isMobile) return;

    // Projected velocity & offset threshold for dismiss
    if (info.offset.y > 90 || info.velocity.y > 400) {
      onDismiss();
    }
  };

  const dragProps = isMobile
    ? {
        drag: "y" as const,
        dragListener: false,
        dragControls: dragControls,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0.05, bottom: 0.75 },
        onDragEnd: handleDragEnd,
        style: { y },
      }
    : {};

  return {
    isMobile,
    y,
    backdropOpacity,
    dragProps,
    dragControls,
  };
}
