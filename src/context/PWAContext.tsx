"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The `beforeinstallprompt` event is not yet in the TypeScript DOM lib.
 * We define the interface manually for strict typing.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface PWAContextValue {
  /** The captured deferred install prompt event */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** Whether the app is already installed / running in standalone mode */
  isInstalled: boolean;
  /** Whether the install prompt is available */
  isInstallable: boolean;
  /** Programmatically trigger the native install prompt */
  triggerInstall: () => Promise<boolean>;
  /** Dismiss the deferred prompt without installing */
  clearPrompt: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Keep ref in sync for stable callbacks
  useEffect(() => {
    promptRef.current = deferredPrompt;
  }, [deferredPrompt]);

  useEffect(() => {
    // Register service worker immediately on mount to trigger PWA installability
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] Service worker registration failed:", err);
        });
    }

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the native browser install prompt.
   * Returns `true` if the user accepted, `false` otherwise.
   */
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    const prompt = promptRef.current;
    if (!prompt) return false;

    const result = await prompt.prompt();
    const accepted = result.outcome === "accepted";

    if (accepted) {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);

    return accepted;
  }, []);

  const clearPrompt = useCallback(() => {
    setDeferredPrompt(null);
  }, []);

  const value = useMemo<PWAContextValue>(
    () => ({
      deferredPrompt,
      isInstalled,
      isInstallable: deferredPrompt !== null && !isInstalled,
      triggerInstall,
      clearPrompt,
    }),
    [deferredPrompt, isInstalled, triggerInstall, clearPrompt]
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

/**
 * Hook to access the PWA install context.
 * Must be used within a `<PWAProvider>`.
 */
export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
