"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PWAProvider } from "@/context/PWAContext";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { PWAInstallTrigger } from "@/components/pwa/PWAInstallTrigger";

function DevtoolsGuard() {
  const [devtoolsOpen, setDevtoolsOpen] = React.useState(false);
  const pathRef = React.useRef<string>('');
  const isMacRef = React.useRef(false);

  const redirectToDebugger = React.useCallback(() => {
    if (window.location.pathname === '/debugger') {
      return;
    }

    window.location.replace(`/debugger?callbackUrl=${pathRef.current}`);
  }, []);

  React.useEffect(() => {
    pathRef.current = window.location.pathname;
    // Detect macOS once on mount
    isMacRef.current =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;
      const key = event.key.toLowerCase();
      const isMac = isMacRef.current;

      // On macOS the primary modifier is ⌘ (metaKey); on Windows/Linux it's Ctrl.
      // We must NOT treat standalone ⌘+<key> combos (copy/paste/undo) as inspect shortcuts.
      const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

      const isInspectShortcut =
        // F12 — universal DevTools toggle (Windows/Linux; macOS has no default F12 binding)
        event.key === 'F12' ||
        // Ctrl/⌘ + Shift + I/J/C — DevTools panel shortcuts
        (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        // Alt + Ctrl/⌘ + I/J/C — alternative DevTools shortcuts (mainly Firefox)
        (event.altKey && ctrlOrMeta && ['i', 'j', 'c'].includes(key)) ||
        // Ctrl/⌘ + U — View Source
        (ctrlOrMeta && !event.shiftKey && !event.altKey && key === 'u') ||
        // Context menu key (Windows keyboards)
        event.key === 'ContextMenu' ||
        // Shift+F10 — context menu shortcut
        (event.shiftKey && event.key === 'F10') ||
        // macOS-specific: ⌘+⌥+I (Safari/Chrome DevTools toggle)
        (isMac && event.metaKey && event.altKey && key === 'i') ||
        // macOS-specific: ⌘+⌥+C (Chrome inspect element)
        (isMac && event.metaKey && event.altKey && key === 'c');

      if (isInspectShortcut) {
        event.preventDefault();
        event.stopPropagation();
        redirectToDebugger();
      }
    };

    // Heuristic: large outer vs inner size gap usually means DevTools is docked open.
    // On macOS, Safari and the notch/Retina displays can produce larger chrome areas,
    // so we use a higher threshold and also check both dimensions together.
    const detectDevtools = () => {
      const isMobile =
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      if (isMobile) return;

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // macOS needs a much higher threshold because:
      //  - Safari has a tall toolbar + tab bar (~80-100px)
      //  - MacBook notch adds ~32px
      //  - Retina scaling can double reported pixel differences
      //  - Stage Manager / full-screen transitions cause transient spikes
      const isMac = isMacRef.current;
      const threshold = isMac ? 300 : 160;

      // Require at least one dimension to significantly exceed threshold.
      // Using both dims prevents false positives from tall title bars or wide sidebars.
      const isLikelyOpen = widthDiff > threshold || heightDiff > threshold;

      setDevtoolsOpen(isLikelyOpen);

      if (isLikelyOpen) {
        redirectToDebugger();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', detectDevtools);
    // Delay initial check to let the browser settle its layout (macOS fullscreen transitions)
    const initTimeout = window.setTimeout(detectDevtools, 500);

    // Check less frequently to avoid redirect loops on macOS
    const intervalId = window.setInterval(detectDevtools, 2000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', detectDevtools);
      window.clearTimeout(initTimeout);
      window.clearInterval(intervalId);
    };
  }, [redirectToDebugger]);

  if (!devtoolsOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: '#0b0b0b',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '1.1rem',
        textAlign: 'center',
        padding: '1.5rem',
      }}
      aria-live="assertive"
    >
      Inspect tools are disabled on this page.
    </div>
  );
}

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
          <DevtoolsGuard/>
          <React.Suspense fallback={null}>
            <PWAInstallTrigger />
          </React.Suspense>
        </PWAProvider>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
