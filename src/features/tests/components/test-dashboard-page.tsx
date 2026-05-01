"use client";

import { useState, useMemo } from "react";
import {
  IconChecklist,
  IconClockHour4,
  IconListCheck,
  IconCircleCheck,
  IconPlayerPlay,
  IconArrowsSort,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useStudentQuizzes } from "@/features/tests/hooks";
import { QuizCard } from "@/features/tests/components/quiz-card";
import type { QuizSummaryItem } from "@/features/tests/types";

type SortKey = "latest" | "pending" | "completed" | "name";

function sortQuizzes(quizzes: QuizSummaryItem[], sort: SortKey): QuizSummaryItem[] {
  const clone = [...quizzes];
  switch (sort) {
    case "pending":
      return clone.sort((a, b) => {
        const order = { in_progress: 0, not_attempted: 1, completed: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
    case "completed":
      return clone.sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return -1;
        if (a.status !== "completed" && b.status === "completed") return 1;
        return 0;
      });
    case "name":
      return clone.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return clone;
  }
}

export function TestDashboardPage() {
  const { data, isLoading, error } = useStudentQuizzes();
  const [sortBy, setSortBy] = useState<SortKey>("latest");

  const quizzes = data?.quizzes ?? [];
  const enrollmentCount = data?.enrollmentCount ?? 0;
  const inProgressCount = quizzes.filter((quiz) => quiz.status === "in_progress").length;
  const completedCount = quizzes.filter((quiz) => quiz.status === "completed").length;
  const notAttemptedCount = quizzes.filter((quiz) => quiz.status === "not_attempted").length;

  const sorted = useMemo(() => sortQuizzes(quizzes, sortBy), [quizzes, sortBy]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl p-5 md:p-6">
        <Card className="rounded-xl">
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
      <div className="mx-auto w-full max-w-7xl p-5 md:p-6">
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
      <div className="mx-auto w-full max-w-7xl p-5 md:p-6">
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tests</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Start new quizzes, resume active attempts, and review submitted results.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border-border/60 bg-muted/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</p>
                <p className="text-2xl font-bold leading-none">{quizzes.length}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <IconListCheck className="size-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-muted/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold leading-none">{inProgressCount}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <IconClockHour4 className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-muted/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold leading-none">{completedCount}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <IconCircleCheck className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-muted/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Not Attempted</p>
                <p className="text-2xl font-bold leading-none">{notAttemptedCount}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50">
                <IconPlayerPlay className="size-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Sort Controls */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "test" : "tests"}
        </p>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-44">
            <IconArrowsSort className="mr-2 size-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="pending">Pending First</SelectItem>
            <SelectItem value="completed">Completed First</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sorted.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}
