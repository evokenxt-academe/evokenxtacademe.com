"use client";

import { useRouter } from "next/navigation";
import {
  IconAward,
  IconBook2,
  IconChecklist,
  IconClockHour4,
  IconPlayerPlay,
  IconTarget,
  IconInfoCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        void document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Automatic fullscreen request failed:", err);
        });
      }
    } catch (err) {
      console.warn("Fullscreen API not available:", err);
    }

    try {
      await createAttemptMutation.mutateAsync(quizId);
      router.push(`/dashboard/tests/${quizId}/attempt`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start test.");
    }
  };

  if (quizQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-5 md:p-6">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-40 mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizQuery.error || !quizQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl p-5 md:p-6">
        <Card className="mx-auto max-w-xl rounded-xl border-dashed">
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
    <div className="mx-auto w-full max-w-3xl p-5 md:p-6">
      <Card className="rounded-xl border-border/60 overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <IconChecklist className="size-3" />
              Assessment
            </Badge>
            <Badge variant="secondary">{quiz.courseName}</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl leading-tight md:text-3xl">{quiz.title}</CardTitle>
            <CardDescription className="max-w-2xl text-sm md:text-base">
              {quiz.description ?? "Read all instructions carefully and begin when you are ready."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 p-6">
          {/* Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <IconChecklist className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions</p>
                <p className="mt-0.5 text-xl font-semibold">{quiz.questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <IconTarget className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Marks</p>
                <p className="mt-0.5 text-xl font-semibold">{quiz.totalMarks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <IconAward className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass Marks</p>
                <p className="mt-0.5 text-xl font-semibold">{quiz.passingMarks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <IconClockHour4 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Limit</p>
                <p className="mt-0.5 text-lg font-semibold">{formatDuration(quiz.timeLimitSec)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="rounded-xl border bg-muted/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <IconInfoCircle className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Instructions</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <IconBook2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Read each question fully before selecting your answer.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <IconClockHour4 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Timer starts immediately when you click start.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <IconAward className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Minimum score required: <span className="font-medium text-foreground">{quiz.passingMarks}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full gap-2 md:w-auto md:min-w-48"
            onClick={handleStart}
            disabled={createAttemptMutation.isPending}
          >
            <IconPlayerPlay className="size-4" />
            {createAttemptMutation.isPending ? "Starting..." : "Start Test"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
