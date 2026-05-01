"use client";

import { useRouter } from "next/navigation";
import {
  IconAward,
  IconBook2,
  IconChecklist,
  IconClockHour4,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateAttempt, useQuiz } from "@/features/tests/hooks";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No time limit";
  const mins = Math.round(seconds / 60);
  return `${mins} minutes`;
}

export function QuizStartPage({ quizId }: { quizId: string }) {
  const router = useRouter();
  const quizQuery = useQuiz(quizId);
  const createAttemptMutation = useCreateAttempt();

  const handleStart = async () => {
    try {
      await createAttemptMutation.mutateAsync(quizId);
      router.push(`/dashboard/tests/${quizId}/attempt`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start test.");
    }
  };

  if (quizQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizQuery.error || !quizQuery.data) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-3xl border-dashed">
          <CardHeader>
            <CardTitle>Quiz unavailable</CardTitle>
            <CardDescription>
              {quizQuery.error instanceof Error
                ? quizQuery.error.message
                : "We could not load this quiz."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const quiz = quizQuery.data;

  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto max-w-3xl overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-linear-to-b from-muted/60 to-background">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background/70">
              <IconChecklist data-icon="inline-start" />
              Assessment
            </Badge>
            <Badge variant="secondary" className="bg-background/70 text-foreground">
              {quiz.courseName}
            </Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl leading-tight md:text-3xl">{quiz.title}</CardTitle>
            <CardDescription className="max-w-2xl text-sm md:text-base">
              {quiz.description ?? "Read all instructions carefully and begin when you are ready."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions</p>
              <p className="mt-2 text-2xl font-semibold">{quiz.questions.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total marks</p>
              <p className="mt-2 text-2xl font-semibold">{quiz.totalMarks}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass marks</p>
              <p className="mt-2 text-2xl font-semibold">{quiz.passingMarks}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time limit</p>
              <p className="mt-2 text-lg font-semibold">{formatDuration(quiz.timeLimitSec)}</p>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-3">
            <div className="flex items-start gap-2">
              <IconBook2 className="mt-0.5 size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Read each question fully before selecting your answer.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <IconClockHour4 className="mt-0.5 size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Timer starts immediately when you click start.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <IconAward className="mt-0.5 size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Minimum score required: <span className="font-medium text-foreground">{quiz.passingMarks}</span>.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={handleStart}
            disabled={createAttemptMutation.isPending}
          >
            <IconPlayerPlay data-icon="inline-start" />
            {createAttemptMutation.isPending ? "Starting..." : "Start test"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
