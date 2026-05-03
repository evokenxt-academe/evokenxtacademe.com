"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudentAttemptAnalytics } from "@/features/tests/types";

interface RecentAttemptsListProps {
  attempts: StudentAttemptAnalytics[];
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function RecentAttemptsList({ attempts }: RecentAttemptsListProps) {
  const recentAttempts = useMemo(() => {
    return [...attempts]
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [attempts]);

  if (recentAttempts.length === 0) {
    return (
      <Card className="rounded-xl border-border/50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Attempts</CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Start your first test to see your attempt history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Recent Attempts</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[380px]">
          <div className="divide-y divide-border/50">
            {recentAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/dashboard/tests/result/${attempt.id}`}
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/50"
              >
                {/* Quiz Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {attempt.quizTitle}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{attempt.courseName}</span>
                    {attempt.durationSec != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDuration(attempt.durationSec)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Badge */}
                <Badge
                  variant="secondary"
                  className={
                    attempt.passed
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {attempt.score}/{attempt.totalMarks}
                </Badge>

                {/* Date */}
                <span className="shrink-0 text-xs text-muted-foreground w-16 text-right">
                  {formatRelativeDate(attempt.submittedAt)}
                </span>

                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
