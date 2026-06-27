"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SessionExpiredPage() {
  useEffect(() => {
    const performSignOut = async () => {
      try {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
        });
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {
        console.error("Error cleaning up authentication session:", err);
      }
    };
    void performSignOut();
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4 py-12">
      <div className="w-full max-w-[440px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="overflow-hidden border border-border/80 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-4 text-center">
            {/* Logo */}
            <Link href="/" className="mb-2">
              <div className="relative size-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192x192.png" alt="Evoke EduGlobal Logo" className="rounded-lg object-contain" />
              </div>
            </Link>

            {/* Warning Shield Alert */}
            <div className="relative flex items-center justify-center size-16 rounded-full bg-destructive/10 text-destructive/90 mb-2">
              <span className="absolute size-16 rounded-full bg-destructive/5 animate-ping duration-1000" />
              <ShieldAlert className="size-8 relative z-10" />
            </div>

            {/* Title & Badge */}
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Session Terminated
              </h1>
              <p className="text-sm font-medium text-destructive/80">
                Multiple active sessions detected
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 py-4 space-y-4 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              To ensure the security of your account, course progress, and exams, Evoke EduGlobal only allows one active session at a time.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground font-medium bg-muted/50 rounded-lg p-3.5 border border-border/40">
              You have been signed out because a new login was initiated on another device or web browser.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
            <Button
              id="re-login-btn"
              className="w-full h-11 gap-2 font-medium transition-all duration-200 shadow-sm cursor-pointer"
              onClick={() => window.location.replace("/auth/login")}
            >
              <LogIn className="size-4 shrink-0" />
              Sign In Again
            </Button>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3" />
              Go back to Home
            </Link>

            <div className="border-t border-border/40 w-full pt-4 mt-2">
              <p className="text-[11px] leading-normal text-muted-foreground text-center">
                If you did not authorize this login, please contact Evoke EduGlobal support immediately to secure your account.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
