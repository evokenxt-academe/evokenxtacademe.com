"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePWA } from "@/context/PWAContext";

const MAX_MOBILE_WIDTH = 400;
const INSTALL_DELAY_MS = 1500;

/**
 * Invisible component that auto-triggers the PWA install prompt
 * when the user arrives with `?pwa_install=1` in the URL (set by the auth callback).
 *
 * Mounted inside Providers so it works regardless of which page the user lands on.
 */
export function PWAInstallTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isInstallable, isInstalled, triggerInstall } = usePWA();

  useEffect(() => {
    if (searchParams.get("pwa_install") !== "1") return;
    if (!isInstallable) return;
    if (isInstalled) return;

    // Only trigger on mobile
    if (window.innerWidth > MAX_MOBILE_WIDTH) return;

    // Don't trigger in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);
    if (isStandalone) return;

    const timer = setTimeout(() => {
      triggerInstall();

      // Clean up the URL param without triggering a navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pwa_install");
      const newQuery = params.toString();
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, INSTALL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [searchParams, isInstallable, isInstalled, triggerInstall, router, pathname]);

  return null;
}
