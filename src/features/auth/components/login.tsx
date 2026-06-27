"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, MonitorSmartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32l3.57 2.77c2.08-1.92 3.27-4.74 3.27-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginCard() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = React.useState<boolean>(true);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") || searchParams.get("next") || "/dashboard";
  const authError = searchParams.get("error");
  const blockReason = searchParams.get("reason");

  React.useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const supabase = createClient() as any;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.role === "admin" || profile?.role === "instructor") {
          window.location.replace("/admin");
        } else {
          window.location.replace("/dashboard");
        }
      } else {
        setIsCheckingSession(false);
      }
    };
    checkSessionAndRedirect();
  }, []);

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);

    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      // PWA Popup Flow to prevent redirecting out of the app
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}&pwa=1`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tvyakrbmfqeylgkqwkdu.supabase.co";
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&scopes=email+profile`;

      // Open a popup window centered
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        "Google Sign In",
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        toast.error("Popup blocked! Please allow popups for this site.");
        setIsLoading(false);
        return;
      }

      // Listen for message from the popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === "AUTH_SUCCESS") {
          window.removeEventListener("message", handleMessage);
          popup.close();

          // Successfully logged in! Retrieve session and redirect
          const supabase = createClient() as any;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: profile } = await supabase
              .from("users")
              .select("role")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile?.role === "admin" || profile?.role === "instructor") {
              window.location.replace("/admin");
            } else {
              window.location.replace("/dashboard");
            }
          } else {
            window.location.replace(redirectUrl);
          }
        } else if (event.data?.type === "AUTH_ERROR") {
          window.removeEventListener("message", handleMessage);
          popup.close();
          toast.error(event.data.message || "Authentication failed");
          setIsLoading(false);
        }
      };

      window.addEventListener("message", handleMessage);

      // Monitor if popup is closed manually by user
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setIsLoading(false);
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    } else {
      // Standard Flow
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
          scopes: "email profile",
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
    }
  };

  if (isCheckingSession) {
    return (
      <div className="w-full max-w-[420px] mx-4 flex flex-col items-center justify-center p-8 bg-card border rounded-2xl shadow-sm gap-4 text-center">
        <Spinner className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col items-center gap-5 py-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative size-13">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/evoke-logo.svg" alt="Evoke EduGlobal Logo" className="rounded-lg object-contain" />
            </div>
          </Link>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to continue your learning journey
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {(blockReason === "active_session" || authError) && (
            <Alert
              variant={blockReason === "active_session" ? "default" : "destructive"}
              className={
                blockReason === "active_session"
                  ? "border-amber-500/30 bg-amber-500/5 text-foreground"
                  : undefined
              }
            >
              {blockReason === "active_session" ? (
                <MonitorSmartphone className="size-4 text-amber-600 dark:text-amber-400" />
              ) : null}
              <AlertTitle className="text-sm font-semibold">
                {blockReason === "active_session"
                  ? "Account already in use"
                  : "Sign-in failed"}
              </AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">
                {blockReason === "active_session"
                  ? "This Google account is active on another device or browser. Sign out there first, then try again."
                  : authError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              For your security, each Google account can only be signed in on{" "}
              <span className="font-medium text-foreground">one device at a time</span>.
            </p>
          </div>

          {/* Google sign-in button */}
          <Button
            id="google-sign-in-btn"
            variant="outline"
            className="w-full h-10 gap-3 text-sm font-medium transition-all duration-200 hover:bg-accent/80 hover:shadow-sm"
            onClick={handleSignInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <GoogleIcon className="size-5 shrink-0" />
            )}
            Continue with Google
          </Button>


        </CardContent>

        <CardFooter className="flex-col gap-3 bg-transparent border-t-0 px-8 pb-7 pt-4">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardFooter>
      </Card>


    </div>
  );
}
