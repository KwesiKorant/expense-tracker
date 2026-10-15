"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * useTransactionRealtime Hook — Supabase CDC Synchronization
 * Listens for PostgreSQL Change Data Capture events on the Transaction table
 * and automatically triggers optimistic cache invalidation across all connected tabs.
 */
export function useTransactionRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;

    const channelName = `realtime-transactions-${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Transaction",
          filter: `userId=eq.${userId}`,
        },
        (payload: unknown) => {
          console.log("⚡ Supabase Realtime CDC Event:", payload);
          // Invalidate transactions and analytics summaries immediately
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
