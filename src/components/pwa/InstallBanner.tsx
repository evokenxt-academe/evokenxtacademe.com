"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePWA } from "@/context/PWAContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Share } from "lucide-react";

const DISMISSED_KEY = "pwa_banner_dismissed_at";
const COOLDOWN_DAYS = 7;

/**
 * Mobile-friendly install banner that appears at the bottom of the screen.
 * Covers all iPhone versions, iPads, and Android devices.
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, triggerInstall, triggerIOSPrompt, clearPrompt } =
    usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Guard: already installed / standalone
    if (isInstalled) return;

    // Check dismiss cooldown (7 days)
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const lastDismissed = parseInt(dismissedAt, 10);
        const daysSince = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) return;
      }
    } catch {
      // LocalStorage fallback
    }

    // Standalone mode double-check
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true));
    if (isStandalone) return;

    // Guard: not installable and not iOS
    if (!isIOS && !isInstallable) return;

    // Delayed banner appearance for smooth UX
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
      // ignore
    }
    setVisible(false);
    clearPrompt();
  }, [clearPrompt]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      triggerIOSPrompt();
      return;
    }
    const accepted = await triggerInstall();
    if (accepted) {
      setVisible(false);
    }
  }, [isIOS, triggerInstall, triggerIOSPrompt]);

  // Don't render when standalone or installed
  if (isInstalled) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 block md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Card className="rounded-b-none border-t border-border/80 bg-card/95 backdrop-blur-md shadow-2xl py-2.5">
        <CardContent className="flex items-center gap-3 px-3.5 py-0">
          {/* App Icon */}
          <div className="shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="EvokeNxt"
              width={38}
              height={38}
              className="rounded-xl border border-border/50 shadow-sm"
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground truncate">
                EvokeNxt
              </span>
              <Badge
                variant="secondary"
                className="text-[9px] font-extrabold px-1.5 h-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              >
                APP
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {isIOS
                ? "Add to Home Screen for best experience"
                : "Install app for faster access"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 text-xs font-bold px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-sm"
            >
              {isIOS ? (
                <>
                  <Share className="size-3 mr-1" />
                  Install
                </>
              ) : (
                <>
                  <Download className="size-3 mr-1" />
                  Install
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Dismiss install banner"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
