"use client";
import * as React from "react";
import { useUserSession } from "@/features/auth/store/use-user-session";
import { Header } from "@/components/header";

import { HeroSection } from "@/components/hero-section";
import Link from "next/link";

export default function Page() {
  const { user, isLoading, getSession } = useUserSession();

  React.useEffect(() => {
    getSession();
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <HeroSection />
      {/* Adding extra space to allow scrolling to test header states */}
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-white/50">
        Scroll down to see the header transition
      </div>
      <Link href="/admin">Admin</Link>
    </main>
  )
}
