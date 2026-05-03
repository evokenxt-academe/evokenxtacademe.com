"use client";

import { useState, useMemo } from "react";
import { ClipboardList, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useStudentQuizzes,
  useTestAnalytics,
  useTestStats,
  useRealtimeAttempts,
} from "@/features/tests/hooks";
import { StatsCards } from "@/features/tests/components/stats-cards";
import { ScoreChart } from "@/features/tests/components/score-chart";
import { AccuracyChart } from "@/features/tests/components/accuracy-chart";
import { RecentAttemptsList } from "@/features/tests/components/recent-attempts-list";
import { QuizCard } from "@/features/tests/components/quiz-card";
import type { QuizSummaryItem, StatusFilter } from "@/features/tests/types";

// ── Loading Skeleton ──────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[290px] rounded-xl" />
        <Skeleton className="h-[290px] rounded-xl" />
      </div>

      {/* Test List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <Card className="rounded-xl border-border/50 shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <ClipboardList className="size-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────

export function TestDashboardPage() {
  const { data: quizData, isLoading: quizzesLoading, error: quizzesError } = useStudentQuizzes();
  const { data: analyticsData, isLoading: analyticsLoading } = useTestAnalytics();

  // Realtime subscription — invalidates queries on quiz_attempts INSERT/UPDATE
  useRealtimeAttempts();

  // Filter state
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Raw data
  const allQuizzes = quizData?.quizzes ?? [];
  const enrollmentCount = quizData?.enrollmentCount ?? 0;
  const allAttempts = analyticsData?.attempts ?? [];

  // Derive unique courses for filter dropdown
  const courseOptions = useMemo(() => {
    const courseMap = new Map<string, string>();
    for (const q of allQuizzes) {
      if (!courseMap.has(q.courseId)) {
        courseMap.set(q.courseId, q.courseName);
      }
    }
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allQuizzes]);

  // Apply filters
  const filteredQuizzes = useMemo(() => {
    let result = allQuizzes;

    if (courseFilter !== "all") {
      result = result.filter((q) => q.courseId === courseFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }

    return result;
  }, [allQuizzes, courseFilter, statusFilter]);

  const filteredAttempts = useMemo(() => {
    if (courseFilter === "all") return allAttempts;
    return allAttempts.filter((a) => a.courseId === courseFilter);
  }, [allAttempts, courseFilter]);

  // Compute stats from filtered data
  const stats = useTestStats(filteredQuizzes, filteredAttempts);

  // Determine last attempted quiz for highlight
  const lastAttemptedQuizId = useMemo(() => {
    if (!filteredAttempts.length) return null;
    const sorted = [...filteredAttempts].sort((a, b) => {
      const da = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const db = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return db - da;
    });
    return sorted[0]?.quizId ?? null;
  }, [filteredAttempts]);

  // Loading state
  if (quizzesLoading || analyticsLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (quizzesError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <Card className="rounded-xl border-border/50 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Unable to load tests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{quizzesError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No enrollment state
  if (enrollmentCount === 0) {
    return (
      <EmptyState
        title="No courses enrolled"
        description="Enroll in a course to access tests and track your performance."
      />
    );
  }

  // No quizzes state
  if (allQuizzes.length === 0) {
    return (
      <EmptyState
        title="No tests available"
        description="Published tests from your enrolled courses will appear here."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      {/* ─── 1. Header ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance and attempts
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground hidden sm:block" />

          {courseOptions.length > 1 && (
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="not_attempted">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── 2. Stats Overview ────────────────────────────── */}
      <StatsCards stats={stats} />

      {/* ─── 3. Performance Analytics ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreChart attempts={filteredAttempts} />
        <AccuracyChart attempts={filteredAttempts} />
      </div>

      {/* ─── 4. Test List ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            All Tests
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredQuizzes.length})
            </span>
          </h2>
        </div>

        {filteredQuizzes.length === 0 ? (
          <Card className="rounded-xl border-border/50 shadow-none">
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No tests match the current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz: QuizSummaryItem) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                isLastAttempted={quiz.id === lastAttemptedQuizId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. Recent Attempts ────────────────────────────── */}
      <RecentAttemptsList attempts={filteredAttempts} />
    </div>
  );
}
