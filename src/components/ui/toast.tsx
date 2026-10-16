"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: {
    success: (message: string, optsOrDesc?: string | ToastOptions) => void;
    error: (message: string, optsOrDesc?: string | ToastOptions) => void;
    info: (message: string, optsOrDesc?: string | ToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, optsOrDesc?: string | ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const options: ToastOptions =
        typeof optsOrDesc === "string"
          ? { description: optsOrDesc }
          : optsOrDesc || {};

      const duration = options.durationMs || (options.action ? 5000 : 3500);

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          message,
          description: options.description,
          action: options.action,
        },
      ]);

      // Auto-dismiss timer
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, optsOrDesc?: string | ToastOptions) =>
      addToast("success", message, optsOrDesc),
    error: (message: string, optsOrDesc?: string | ToastOptions) =>
      addToast("error", message, optsOrDesc),
    info: (message: string, optsOrDesc?: string | ToastOptions) =>
      addToast("info", message, optsOrDesc),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Stage — Fixed Bottom-Right with Compositor Transitions */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 pb-[env(safe-area-inset-bottom)]"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800"
            >
              {item.type === "success" && (
                <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {item.type === "error" && (
                <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {item.type === "info" && (
                <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.message}
                </p>
                {item.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    removeToast(item.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {item.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
