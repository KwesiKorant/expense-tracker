"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { AppShell } from "@/components/domain/app-shell";
import { useBlurTier } from "@/hooks/use-blur-tier";

function BlurTierSync() {
  useBlurTier();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BlurTierSync />
          <AppShell>{children}</AppShell>
          <OfflineIndicator />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
