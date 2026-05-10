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

/**
 * Mobile-only install banner that appears at the bottom of the screen.
 * Uses shadcn/ui Card, Button, Badge — no custom CSS beyond Tailwind utilities.
 * Only renders on screens ≤ 400px wide, not in standalone mode, and not previously dismissed.
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, triggerInstall, clearPrompt } = usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Guard: desktop / tablet
    if (window.innerWidth > MAX_MOBILE_WIDTH) return;

    // Guard: already installed / standalone
    if (isInstalled) return;

    // Guard: already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Guard: no install prompt available
    if (!isInstallable) return;

    // Guard: standalone mode double-check
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);
    if (isStandalone) return;

    setVisible(true);
  }, [isInstallable, isInstalled]);

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
              Install for a faster experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-7 text-xs px-3"
            >
              Install
            </Button>
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
