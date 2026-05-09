"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              You&apos;re offline
            </h1>
            <p className="text-sm text-muted-foreground">
              Please check your internet connection and try again.
            </p>
          </div>

          <Button onClick={handleRetry} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
