"use client";

import { useEffect } from "react";
import { usePWA } from "@/context/PWAContext";

const MAX_MOBILE_WIDTH = 400;
const INSTALL_DELAY_MS = 1500;

/**
 * Hook to auto-trigger the PWA install prompt after a successful login.
 *
 * Call this hook on the page/component that renders after authentication succeeds.
 *
 * ## Usage
 *
 * ### Case 1: Client-side redirect after fetch (e.g., after `router.push`)
 * ```tsx
 * // In your post-login page component:
 * import { usePWAInstallAfterLogin } from "@/hooks/usePWAInstallAfterLogin";
 *
 * export default function DashboardPage() {
 *   usePWAInstallAfterLogin();
 *   return <div>...</div>;
 * }
 * ```
 *
 * ### Case 2: Server action with redirect()
 * The server action redirects to a page; add the hook to that landing page.
 * Optionally, append `?pwa_install=1` to the redirect URL and check for it:
 * ```ts
 * // In your server action:
 * redirect("/dashboard?pwa_install=1");
 * ```
 * Then in the landing page:
 * ```tsx
 * "use client";
 * import { useSearchParams } from "next/navigation";
 * import { usePWAInstallAfterLogin } from "@/hooks/usePWAInstallAfterLogin";
 *
 * export default function DashboardPage() {
 *   const searchParams = useSearchParams();
 *   const shouldPrompt = searchParams.get("pwa_install") === "1";
 *   usePWAInstallAfterLogin(shouldPrompt);
 *   return <div>...</div>;
 * }
 * ```
 *
 * @param enabled - Whether to attempt the auto-install (defaults to `true`)
 */
export function usePWAInstallAfterLogin(enabled = true): void {
  const { isInstallable, isInstalled, triggerInstall } = usePWA();

  useEffect(() => {
    if (!enabled) return;
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
    }, INSTALL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, isInstallable, isInstalled, triggerInstall]);
}
