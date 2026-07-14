"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePWA } from "@/context/PWAContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const DISMISSED_KEY = "pwa_banner_dismissed";
const MAX_MOBILE_WIDTH = 400;

const SafariShareIcon = () => (
  <svg
    className="h-4 w-4 inline text-emerald-500 mx-1 align-middle"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

/**
 * Mobile-only install banner that appears at the bottom of the screen.
 * Uses shadcn/ui Card, Button, Badge — no custom CSS beyond Tailwind utilities.
 * Only renders on screens ≤ 400px wide, not in standalone mode, and not previously dismissed.
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, triggerInstall, clearPrompt } = usePWA();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent;
      const isIOSDevice =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (window.navigator.platform === "MacIntel" &&
          window.navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    };
    checkIOS();
  }, []);

  useEffect(() => {
    // Guard: desktop / tablet
    if (window.innerWidth > MAX_MOBILE_WIDTH) return;

    // Guard: already installed / standalone
    if (isInstalled) return;

    // Guard: already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Standalone mode double-check
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);
    if (isStandalone) return;

    // Guard: no install prompt available (except on iOS which doesn't support the event)
    if (!isIOS && !isInstallable) return;

    setVisible(true);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    clearPrompt();
  }, [clearPrompt]);

  const handleInstall = useCallback(async () => {
    const accepted = await triggerInstall();
    if (accepted) {
      setVisible(false);
    }
  }, [triggerInstall]);

  // JS guard: never render on larger screens
  if (typeof window !== "undefined" && window.innerWidth > MAX_MOBILE_WIDTH) {
    return null;
  }

  // Don't render when standalone
  if (isInstalled) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 block md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Card className="rounded-b-none border-t shadow-lg py-2.5">
        <CardContent className="flex items-center gap-3 px-3 py-0">
          {/* App Icon */}
          <div className="shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="Evokenxt"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">
                Evokenxt
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                App
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {isIOS ? (
                <span className="flex items-center flex-wrap gap-0.5">
                  Tap <SafariShareIcon /> then "Add to Home Screen"
                </span>
              ) : (
                "Install for a faster experience"
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!isIOS && (
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-7 text-xs px-3"
              >
                Install
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-7 w-7 p-0"
              aria-label="Dismiss install banner"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
