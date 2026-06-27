"use client";

import { usePathname, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { FooterSection } from "@/components/footer-section";
import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export function GlobalLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileOrPWA, setIsMobileOrPWA] = useState(false);

  // Pages where Navigation and Footer should NOT be shown
  const isHiddenRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/auth/") ||
    pathname?.startsWith("/my-courses") ||
    pathname?.startsWith("/learn");

  const isMarketingRoute =
    !pathname?.startsWith("/admin") &&
    !pathname?.startsWith("/dashboard") &&
    !pathname?.startsWith("/auth/") &&
    !pathname?.startsWith("/my-courses") &&
    !pathname?.startsWith("/learn") &&
    !pathname?.startsWith("/courses") &&
    !pathname?.startsWith("/offline") &&
    !pathname?.startsWith("/debugger");

  useEffect(() => {
    setMounted(true);

    const checkDevice = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      return isStandalone;
    };

    if (checkDevice() && isMarketingRoute) {
      setIsMobileOrPWA(true);

      const supabase = createClient() as any;
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile?.role === "admin" || profile?.role === "instructor") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        } else {
          router.replace("/auth/login");
        }
      });
    }
  }, [pathname, router, isMarketingRoute]);

  // Prevent flash of content on mobile/PWA marketing pages after hydration
  if (mounted && isMobileOrPWA && isMarketingRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-6">
        <div className="w-full max-w-[360px] flex flex-col items-center gap-6 text-center">
          <div className="relative size-16 p-2 rounded-2xl bg-card border shadow-sm animate-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/evoke-logo.svg"
              alt="Evoke EduGlobal Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Opening EvokeNxt</h2>
            <p className="text-sm text-muted-foreground">Preparing your personalized learning space...</p>
          </div>
          <Spinner className="size-6 text-primary" />
        </div>
      </div>
    );
  }

  if (isHiddenRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className={pathname?.startsWith("/courses") ? "hidden md:block" : undefined}>
        <Navigation />
      </div>
      <div className="flex-1">
        {children}
      </div>
      <div className={pathname?.startsWith("/courses") ? "hidden md:block" : undefined}>
        <FooterSection />
      </div>
    </div>
  );
}
