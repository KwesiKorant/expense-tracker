"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  holdDurationMs?: number;
  label: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  className?: string;
  fillClassName?: string;
  icon?: React.ReactNode;
}

/**
 * HoldToConfirmButton — Emil Kowalski Hold-to-Delete Interaction Standard
 * Asymmetric physics: Deliberate linear progress fill during hold (1.2s),
 * snappy spring snap-back (150ms) if released early.
 * Prevents accidental purges while feeling extremely tactile and responsive.
 */
export function HoldToConfirmButton({
  onConfirm,
  holdDurationMs = 1200,
  label,
  confirmLabel = "Confirming...",
  isConfirming = false,
  className = "",
  fillClassName = "bg-rose-600/30 dark:bg-rose-500/25",
  icon,
}: HoldToConfirmButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    holdStartRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (isConfirming) return;
    setIsHolding(true);
    holdStartRef.current = performance.now();

    const loop = (now: number) => {
      if (!holdStartRef.current) return;
      const elapsed = now - holdStartRef.current;
      const currentProgress = Math.min(elapsed / holdDurationMs, 1);
      setProgress(currentProgress);

      if (currentProgress >= 1) {
        cancelHold();
        onConfirm();
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [holdDurationMs, isConfirming, onConfirm, cancelHold]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      disabled={isConfirming}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={cancelHold}
      className={`relative overflow-hidden select-none btn-tactile cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Kinematic Progress Fill Layer */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none transition-[clip-path] ${fillClassName}`}
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          transition: isHolding ? "none" : "clip-path 160ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />

      {/* Button Content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5 w-full">
        {isConfirming ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {confirmLabel}
          </>
        ) : (
          <>
            {icon}
            {isHolding ? `Hold... (${Math.round(progress * 100)}%)` : label}
          </>
        )}
      </span>
    </button>
  );
}
