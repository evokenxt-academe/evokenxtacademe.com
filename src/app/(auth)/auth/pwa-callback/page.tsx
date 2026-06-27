"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

function PwaCallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    const errorMsg = searchParams.get("error");

    if (window.opener) {
      if (status === "success") {
        window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
      } else {
        window.opener.postMessage(
          { type: "AUTH_ERROR", message: errorMsg || "Authentication failed" },
          window.location.origin
        );
      }
    } else {
      // If opened directly without opener, redirect to home
      window.location.replace("/");
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse font-medium">
        Completing authentication...
      </p>
    </div>
  );
}

export default function PwaCallbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Loading...
          </p>
        </div>
      }>
        <PwaCallbackHandler />
      </Suspense>
    </main>
  );
}
