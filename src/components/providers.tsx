"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PWAProvider } from "@/context/PWAContext";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { PWAInstallTrigger } from "@/components/pwa/PWAInstallTrigger";

// Workaround for next-themes injecting a script tag that React 19 complains about
// This is a known false-positive warning during development.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes — prevents refetch on tab switch
            gcTime: 10 * 60 * 1000, // 10 minutes — keeps cache in memory
            refetchOnWindowFocus: false,
            refetchOnMount: false, // reuse cache when remounting on tab switch
            refetchOnReconnect: "always",
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <PWAProvider>
          {children}
          <InstallBanner />
          <React.Suspense fallback={null}>
            <PWAInstallTrigger />
          </React.Suspense>
        </PWAProvider>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
