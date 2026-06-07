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
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
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

  function DevtoolsGuard() {
    const [devtoolsOpen, setDevtoolsOpen] = React.useState(false);
    const pathRef = React.useRef<string>("");

    const redirectToDebugger = React.useCallback(() => {
      if (
        window.location.pathname.startsWith(
          `/debugger?callbackUrl=${pathRef.current}`,
        )
      ) {
        return;
      }

      window.location.replace(`/debugger?callbackUrl=${pathRef.current}`);
    }, []);

    React.useEffect(() => {
      pathRef.current = window.location.pathname;

      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (!event.key) return;
        const key = event.key.toLowerCase();
        const isModifierCombo = event.ctrlKey || event.metaKey;
        const isAltModifierCombo = event.altKey && isModifierCombo;
        const isInspectShortcut =
          event.key === "F12" ||
          (isModifierCombo &&
            event.shiftKey &&
            ["i", "j", "c"].includes(key)) ||
          (isAltModifierCombo && ["i", "j", "c"].includes(key)) ||
          (isModifierCombo && key === "u") ||
          event.key === "ContextMenu" ||
          (event.shiftKey && event.key === "F10");

        if (isInspectShortcut) {
          event.preventDefault();
          event.stopPropagation();
          redirectToDebugger();
        }
      };

      // Heuristic: large outer vs inner size gap usually means DevTools is docked open.
      const detectDevtools = () => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        const threshold = 150;
        const isLikelyOpen = widthDiff > threshold || heightDiff > threshold;
        setDevtoolsOpen(isLikelyOpen);

        if (isLikelyOpen) {
          redirectToDebugger();
        }
      };

      window.addEventListener("contextmenu", handleContextMenu);
      window.addEventListener("keydown", handleKeyDown, true);
      window.addEventListener("resize", detectDevtools);
      detectDevtools();

      const intervalId = window.setInterval(detectDevtools, 1000);

      return () => {
        window.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("keydown", handleKeyDown, true);
        window.removeEventListener("resize", detectDevtools);
        window.clearInterval(intervalId);
      };
    }, [redirectToDebugger]);

    if (!devtoolsOpen) {
      return null;
    }

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483647,
          background: "#0b0b0b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: "1.1rem",
          textAlign: "center",
          padding: "1.5rem",
        }}
        aria-live="assertive"
      >
        Inspect tools are disabled on this page.
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <PWAProvider>
          {/* <DevtoolsGuard /> */}
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
