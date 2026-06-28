"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePWA } from "@/context/PWAContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MonitorSmartphone, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * Component that auto-triggers the PWA install dialog
 * when the user arrives with `?pwa_install=1` in the URL (set by the auth callback).
 *
 * Renders a premium dialog with details and lets the user trigger the prompt.
 */
export function PWAInstallTrigger() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isInstallable, isInstalled, triggerInstall } = usePWA();

  const cleanupUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pwa_install");
    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Sync state to determine standalone mode
  const getIsStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true)
    );
  }, []);

  useEffect(() => {
    const isPwaInstallParamPresent = searchParams.get("pwa_install") === "1";
    if (!isPwaInstallParamPresent) return;

    const isStandalone = getIsStandalone();
    if (isInstalled || isStandalone) {
      cleanupUrl();
      return;
    }

    if (isInstallable) {
      setOpen(true);
    }
  }, [searchParams, isInstallable, isInstalled, getIsStandalone, cleanupUrl]);

  const handleClose = () => {
    setOpen(false);
    cleanupUrl();
  };

  const handleInstallClick = async () => {
    setOpen(false);
    cleanupUrl();
    await triggerInstall();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl">
        <DialogHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
            <MonitorSmartphone className="size-7" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
              Install EvokeNxt App
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Enhance your ACCA prep with offline access, faster loading speeds, and instant notifications.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
            <Sparkles className="size-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Faster Experience</p>
              <p className="text-[11px] text-muted-foreground">Quick access from your home screen or desktop without browser tabs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Stay Connected</p>
              <p className="text-[11px] text-muted-foreground">Get immediate notifications for updates, live sessions, and announcements.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full sm:w-auto order-2 sm:order-1 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Not Now
          </Button>
          <Button
            onClick={handleInstallClick}
            className="w-full sm:flex-1 order-1 sm:order-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md shadow-emerald-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Install Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
