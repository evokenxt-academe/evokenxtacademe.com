"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Target,
  Trophy,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QuizSummaryItem } from "@/features/tests/types";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

interface QuizCardProps {
  quiz: QuizSummaryItem;
  isLastAttempted?: boolean;
}

export function QuizCard({ quiz, isLastAttempted = false }: QuizCardProps) {
  const isCompleted = quiz.status === "completed";
  const isInProgress = quiz.status === "in_progress";

  const scorePercent =
    isCompleted && quiz.latestScore != null && quiz.totalMarks > 0
      ? Math.round((quiz.latestScore / quiz.totalMarks) * 100)
      : null;

  const isPassed =
    isCompleted &&
    quiz.latestScore != null &&
    quiz.latestScore >= quiz.passingMarks;

  const actionHref = isInProgress
    ? `/dashboard/quiz/${quiz.id}`
    : isCompleted && quiz.latestAttemptId
      ? `/dashboard/tests/result/${quiz.latestAttemptId}`
      : `/dashboard/quiz/${quiz.id}`;

  const actionLabel = isInProgress
    ? "Continue Test"
    : isCompleted
      ? "View Result"
      : "Start Test";

  const ActionIcon = isInProgress ? RotateCcw : isCompleted ? ArrowRight : Play;

  return (
    <Link
      href={actionHref}
      className={cn(
        "block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <Card
        className={cn(
          "group flex h-full flex-col rounded-xl border-border/50 shadow-none transition-all duration-200",
          "hover:border-border hover:shadow-sm",
          isLastAttempted && "ring-1 ring-primary/20",
        )}
      >
        <CardHeader className="flex flex-col space-y-2.5 p-5 pb-3">
          {/* Course + Status Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {quiz.courseName}
              </span>
            </div>

            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 text-[10px] font-medium",
                isCompleted && isPassed &&
                  "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
                isCompleted && !isPassed &&
                  "bg-red-50 text-red-600 hover:bg-red-50 dark:bg-red-950/40 dark:text-red-400",
                isInProgress &&
                  "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
                !isCompleted && !isInProgress &&
                  "bg-zinc-100 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              {isCompleted
                ? isPassed
                  ? "Passed"
                  : "Failed"
                : isInProgress
                  ? "In Progress"
                  : "Not Started"}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {quiz.title}
          </h3>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 px-5 pt-0 pb-4">
          {/* Meta Row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5" />
              <span>{quiz.totalMarks} marks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{formatDuration(quiz.timeLimitSec)}</span>
            </div>
          </div>

          {/* In-progress: progress bar */}
          {isInProgress && (
            <div className="mt-auto space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>In progress</span>
              </div>
              <Progress value={50} className="h-1.5" />
            </div>
          )}

          {/* Completed: score display */}
          {isCompleted && scorePercent != null && (
            <div className="mt-auto pt-1">
              <div className="flex items-center gap-2">
                <Trophy
                  className={cn(
                    "size-3.5",
                    isPassed ? "text-emerald-500" : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">
                  <span
                    className={cn(
                      "font-semibold",
                      isPassed ? "text-emerald-600" : "text-foreground",
                    )}
                  >
                    {quiz.latestScore}
                  </span>
                  <span className="text-muted-foreground">
                    /{quiz.totalMarks}
                  </span>
                </span>
                <span className="ml-auto text-xs font-medium text-muted-foreground">
                  {scorePercent}%
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-0">
          <div className="flex w-full items-center justify-between border-t border-border/40 px-5 py-3 transition-colors group-hover:bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
              {actionLabel}
            </span>
            <ActionIcon className="size-3.5 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
