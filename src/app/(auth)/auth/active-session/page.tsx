"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MonitorSmartphone, ArrowLeft, Mail } from "lucide-react";

export default function ActiveSessionPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4 py-12">
      <div className="w-full max-w-[460px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="overflow-hidden border border-border/80 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-4 text-center">
            <Link href="/" className="mb-2">
              <div className="relative size-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192x192.png"
                  alt="Evoke EduGlobal Logo"
                  className="rounded-lg object-contain"
                />
              </div>
            </Link>

            <div className="relative flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <MonitorSmartphone className="size-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Account already in use
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                One active session per Google account
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-8 py-2 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              This Google account is already signed in on another device or browser.
              To protect your courses, progress, and exam integrity, only one session
              is allowed at a time.
            </p>
            <div className="rounded-lg border border-border/50 bg-muted/40 p-4 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground">To sign in here:</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Open Evoke EduGlobal on your other device or browser.</li>
                <li>Sign out from your account.</li>
                <li>Return here and sign in with Google again.</li>
              </ol>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-8 pb-8 pt-4">
            <Button
              className="h-11 w-full gap-2 font-medium"
              onClick={() => window.location.replace("/auth/login")}
            >
              Back to sign in
            </Button>

            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
              Go back to Home
            </Link>

            <div className="mt-2 w-full border-t border-border/40 pt-4">
              <p className="flex items-center justify-center gap-1.5 text-[11px] leading-normal text-muted-foreground">
                <Mail className="size-3 shrink-0" />
                Need help? Contact Evoke EduGlobal support if you did not authorize
                the other session.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
