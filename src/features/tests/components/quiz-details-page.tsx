"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttempt, useQuiz } from "@/features/tests/hooks";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No time limit";
  const mins = Math.round(seconds / 60);
  return `${mins} minutes`;
}

export function QuizDetailsPage({ quizId }: { quizId: string }) {
  const quizQuery = useQuiz(quizId);
  const attemptQuery = useAttempt(quizId);

  if (quizQuery.isLoading || attemptQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizQuery.data || quizQuery.error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Quiz unavailable</CardTitle>
            <CardDescription>
              {quizQuery.error instanceof Error ? quizQuery.error.message : "Unable to load quiz details."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const quiz = quizQuery.data;
  const inProgressAttempt = attemptQuery.data;
  const ctaHref = inProgressAttempt
    ? `/dashboard/tests/${quizId}/attempt`
    : `/dashboard/tests/${quizId}/start`;
  const ctaLabel = inProgressAttempt ? "Continue test" : "Start test";

  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{quiz.courseName}</Badge>
            <Badge variant={inProgressAttempt ? "secondary" : "outline"}>
              {inProgressAttempt ? "In progress" : "Not attempted"}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>{quiz.description ?? "Review details before starting your test."}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{quiz.questions.length}</p>
              <p className="text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{quiz.totalMarks}</p>
              <p className="text-muted-foreground">Total marks</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{quiz.passingMarks}</p>
              <p className="text-muted-foreground">Passing marks</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{formatDuration(quiz.timeLimitSec)}</p>
              <p className="text-muted-foreground">Time limit</p>
            </div>
          </div>

          <Button asChild>
            <Link href={ctaHref}>
              {ctaLabel}
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
