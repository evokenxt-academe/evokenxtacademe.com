"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconClockHour4,
  IconTarget,
  IconTrophy,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizSummaryItem } from "@/features/tests/types";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No limit";
  const mins = Math.round(seconds / 60);
  return `${mins}m`;
}

export function QuizCard({ quiz }: { quiz: QuizSummaryItem }) {
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

  // Primary action based on status
  const actionHref = isInProgress
    ? `/dashboard/tests/${quiz.id}/attempt`
    : isCompleted && quiz.latestAttemptId
      ? `/dashboard/tests/result/${quiz.latestAttemptId}`
      : `/dashboard/tests/${quiz.id}`;

  const actionLabel = isInProgress
    ? "Continue Test"
    : isCompleted
      ? "View Result"
      : "View Details";

  return (
    <Link href={actionHref} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
      <Card className={cn(
        "group flex h-full flex-col rounded-xl transition-all duration-200 hover:shadow-md hover:border-primary/20",
        isCompleted ? "bg-muted/5 border-border/50" : "border-border/80"
      )}>
        <CardHeader className="flex flex-col p-5 pb-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="line-clamp-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {quiz.courseName}
              </span>
              <span className="line-clamp-1 text-xs font-medium text-muted-foreground/80">
                {quiz.sectionTitle}
              </span>
            </div>
            
            {/* Status Badge */}
            <Badge 
              variant={isCompleted ? "secondary" : isInProgress ? "default" : "outline"} 
              className={cn(
                "shrink-0 font-medium mt-0.5",
                isCompleted && !isPassed && "bg-destructive/10 text-destructive hover:bg-destructive/10",
                isCompleted && isPassed && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
                isInProgress && "bg-primary text-primary-foreground"
              )}
            >
              {isCompleted ? (isPassed ? "Passed" : "Failed") : isInProgress ? "In Progress" : "Not Started"}
            </Badge>
          </div>
          
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {quiz.title}
          </h3>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-4">
          {/* Minimal Meta Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <IconTarget className="size-4" />
              <span>{quiz.totalMarks} Marks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconClockHour4 className="size-4" />
              <span>{formatDuration(quiz.timeLimitSec)}</span>
            </div>
          </div>

          {/* Clean Score Display */}
          {isCompleted && scorePercent != null && (
            <div className="mt-auto pt-2">
              <div className="flex items-center gap-2">
                <IconTrophy className={cn("size-4", isPassed ? "text-emerald-500" : "text-muted-foreground")} />
                <span className="text-sm font-medium">
                  Score: <span className={cn("font-bold", isPassed ? "text-emerald-600" : "text-foreground")}>{quiz.latestScore}</span>
                  <span className="text-muted-foreground">/{quiz.totalMarks}</span>
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {scorePercent}%
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-0">
          <div className="flex w-full items-center justify-between border-t border-border/50 bg-muted/10 px-5 py-3 transition-colors group-hover:bg-primary/5">
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              {actionLabel}
            </span>
            <IconArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
