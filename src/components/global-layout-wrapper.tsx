"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { FooterSection } from "@/components/footer-section";
import { ReactNode } from "react";

export function GlobalLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages where Navigation and Footer should NOT be shown
  const isHiddenRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth/login") || pathname?.startsWith("/my-courses") || pathname?.startsWith("/learn")

  if (isHiddenRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <div className="flex-1">
        {children}
      </div>
      <FooterSection />
    </div>
  );
}
