"use client";


import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <Card className="mx-auto w-full max-w-lg border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold">Unable to load courses</h4>
          <p className="text-sm text-muted-foreground">
            Something went wrong. Please check your connection and try again.
          </p>
        </div>
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
