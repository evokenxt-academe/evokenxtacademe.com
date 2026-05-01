"use client";

import { IconChecklist } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentQuizzes } from "@/features/tests/hooks";
import { QuizCard } from "@/features/tests/components/quiz-card";

export function TestDashboardPage() {
  const { data, isLoading, error } = useStudentQuizzes();
  const quizzes = data?.quizzes ?? [];
  const enrollmentCount = data?.enrollmentCount ?? 0;
  const inProgressCount = quizzes.filter((quiz) => quiz.status === "in_progress").length;
  const completedCount = quizzes.filter((quiz) => quiz.status === "completed").length;
  const notAttemptedCount = quizzes.filter((quiz) => quiz.status === "not_attempted").length;

  if (isLoading) {
    return (
      <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load tests</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (enrollmentCount === 0) {
    return (
      <div className="p-4 md:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconChecklist />
            </EmptyMedia>
            <EmptyTitle>You are not enrolled in any courses</EmptyTitle>
            <EmptyDescription>
              Enroll in a course to view and attempt tests.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconChecklist />
            </EmptyMedia>
            <EmptyTitle>No tests available for your courses</EmptyTitle>
            <EmptyDescription>
              Published quizzes from your enrolled courses will appear here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tests</h1>
        <p className="text-sm text-muted-foreground">
          Start new quizzes, resume active attempts, and review submitted results.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Available tests</p>
            <p className="mt-1 text-2xl font-semibold">{quizzes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">In progress</p>
            <p className="mt-1 text-2xl font-semibold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
            <p className="mt-1 text-2xl font-semibold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Not attempted</p>
            <p className="mt-1 text-2xl font-semibold">{notAttemptedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}
