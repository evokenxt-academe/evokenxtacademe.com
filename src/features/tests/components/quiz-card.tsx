"use client";

import Link from "next/link";
import { IconArrowRight, IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizSummaryItem } from "@/features/tests/types";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No time limit";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function statusLabel(status: QuizSummaryItem["status"]) {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  return "Not attempted";
}

function ctaLabel(status: QuizSummaryItem["status"]) {
  if (status === "in_progress") return "Continue";
  if (status === "completed") return "View result";
  return "Start";
}

function ctaHref(quiz: QuizSummaryItem) {
  if (quiz.status === "in_progress") return `/dashboard/tests/${quiz.id}/attempt`;
  if (quiz.status === "completed" && quiz.latestAttemptId) {
    return `/dashboard/tests/result/${quiz.latestAttemptId}`;
  }
  return `/dashboard/tests/${quiz.id}/start`;
}

export function QuizCard({ quiz }: { quiz: QuizSummaryItem }) {
  return (
    <Card className="border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{quiz.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {quiz.description ?? `${quiz.courseName} - ${quiz.sectionTitle}`}
            </CardDescription>
          </div>
          <Badge variant={quiz.status === "completed" ? "secondary" : "outline"}>
            {statusLabel(quiz.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{quiz.courseName}</Badge>
          <Badge variant="outline">{quiz.sectionTitle}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">{quiz.totalMarks}</p>
            <p>Total marks</p>
          </div>
          <div>
            <p className="font-medium text-foreground">{quiz.passingMarks}</p>
            <p>Passing marks</p>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <IconClock />
            <span>{formatDuration(quiz.timeLimitSec)}</span>
          </div>
        </div>

        <Button asChild>
          <Link href={ctaHref(quiz)}>
            {ctaLabel(quiz.status)}
            <IconArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
