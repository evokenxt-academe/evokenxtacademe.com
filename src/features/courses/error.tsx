"use client";

/**
 * 🎓 Error Handling Component
 * Displayed when course data fails to load from Supabase
 */

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CourseDetailErrorProps {
  error: Error | null;
  slug: string;
  onRetry?: () => void;
}

export function CourseDetailError({
  error,
  slug,
  onRetry,
}: CourseDetailErrorProps) {
  const isNotFound = error?.message?.includes("no data returned");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>
            {isNotFound ? "Course Not Found" : "Unable to Load Course"}
          </CardTitle>
          <CardDescription>
            {isNotFound
              ? `We couldn't find the course "${slug}"`
              : "There was a problem loading the course. Please try again."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && !isNotFound && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground break-words">
                <strong>Error:</strong> {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="flex-1">
                Try Again
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/courses"
              className="text-sm text-primary hover:underline"
            >
              Browse all courses
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
