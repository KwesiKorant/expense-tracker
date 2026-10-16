"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const wasOffline = useRef<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      // Trigger restored toast
      const showTimer = setTimeout(() => setShowRestored(true), 0);
      const hideTimer = setTimeout(() => setShowRestored(false), 2500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-zinc-200 text-xs font-semibold shadow-lg shadow-black/20"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline — Local changes pending reconnect</span>
        </motion.div>
      )}

      {showRestored && isOnline && (
        <motion.div
          key="restored"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-zinc-200 text-xs font-semibold shadow-lg shadow-black/20"
          role="status"
          aria-live="polite"
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Connection restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
