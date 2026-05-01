"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconClockHour4,
  IconDownload,
  IconFileDescription,
  IconHistory,
  IconTrophy,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAttempt, useQuiz, useQuizInsights } from "@/features/tests/hooks";

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "No time limit";
  const mins = Math.round(seconds / 60);
  return `${mins} minutes`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDurationSec(value: number | null) {
  if (value == null || value <= 0) return "—";
  const min = Math.floor(value / 60);
  const sec = value % 60;
  return `${min}m ${sec}s`;
}

const reportChartConfig = {
  count: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
} as const;

export function QuizDetailsPage({ quizId }: { quizId: string }) {
  const quizQuery = useQuiz(quizId);
  const attemptQuery = useAttempt(quizId);
  const insightsQuery = useQuizInsights(quizId);

  if (quizQuery.isLoading || attemptQuery.isLoading || insightsQuery.isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-5xl">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizQuery.data || !insightsQuery.data || quizQuery.error || insightsQuery.error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Quiz unavailable</CardTitle>
            <CardDescription>
              {quizQuery.error instanceof Error
                ? quizQuery.error.message
                : insightsQuery.error instanceof Error
                  ? insightsQuery.error.message
                  : "Unable to load quiz details."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const quiz = quizQuery.data;
  const insights = insightsQuery.data;
  const inProgressAttempt = attemptQuery.data;
  const ctaHref = inProgressAttempt
    ? `/dashboard/tests/${quizId}/attempt`
    : `/dashboard/tests/${quizId}/start`;
  const ctaLabel = inProgressAttempt ? "Continue test" : "Start test";

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:gap-6">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 bg-linear-to-r from-primary/10 via-background to-background">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{quiz.courseName}</Badge>
                <Badge variant="outline">{quiz.sectionTitle}</Badge>
              </div>
              <Badge variant={inProgressAttempt ? "secondary" : "outline"}>
                {inProgressAttempt ? "In progress" : "Not attempted"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl md:text-3xl">{quiz.title}</CardTitle>
              <CardDescription className="max-w-3xl text-sm md:text-base">
                {quiz.description ?? "Review details before starting your test."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions</p>
              <p className="mt-1 text-2xl font-semibold">{insights.about.questionCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total marks</p>
              <p className="mt-1 text-2xl font-semibold">{insights.about.totalMarks}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass marks</p>
              <p className="mt-1 text-2xl font-semibold">{insights.about.passingMarks}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time limit</p>
              <p className="mt-1 text-xl font-semibold">{formatDuration(insights.about.timeLimitSec)}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="about" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="about">
              <IconFileDescription data-icon="inline-start" />
              About
            </TabsTrigger>
            <TabsTrigger value="report">
              <IconDownload data-icon="inline-start" />
              Report
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <IconTrophy data-icon="inline-start" />
              Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Assessment overview</CardTitle>
                <CardDescription>
                  Keep this page as your quick reference before you begin the test.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_280px]">
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/15 p-4">
                  <p className="text-sm text-muted-foreground">
                    {insights.about.description ?? "No additional instructions were provided for this test."}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium">Course</p>
                      <p className="text-muted-foreground">{insights.about.courseName}</p>
                    </div>
                    <div>
                      <p className="font-medium">Section</p>
                      <p className="text-muted-foreground">{insights.about.sectionTitle}</p>
                    </div>
                    <div>
                      <p className="font-medium">Attempts logged</p>
                      <p className="text-muted-foreground">{insights.report.attempts}</p>
                    </div>
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-muted-foreground">{insights.report.participants}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">Ready to start?</p>
                  <p className="text-sm text-muted-foreground">
                    Start a fresh attempt or resume your in-progress test. Progress is saved automatically.
                  </p>
                  <Button asChild>
                    <Link href={ctaHref}>
                      {ctaLabel}
                      <IconArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Score distribution</CardTitle>
                  <CardDescription>How students performed across score brackets.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={reportChartConfig} className="h-72 w-full">
                    <BarChart data={insights.report.distribution} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {insights.report.distribution.map((bucket) => (
                          <Cell
                            key={bucket.label}
                            fill={
                              bucket.label === "81-100%"
                                ? "hsl(var(--chart-2))"
                                : bucket.label === "61-80%"
                                  ? "hsl(var(--chart-3))"
                                  : "hsl(var(--chart-1))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Report snapshot</CardTitle>
                  <CardDescription>Live metrics synced from the latest submissions.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Average score</p>
                    <p className="mt-1 text-xl font-semibold">{insights.report.averageScore}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Highest score</p>
                    <p className="mt-1 text-xl font-semibold">{insights.report.highestScore}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass rate</p>
                    <p className="mt-1 text-xl font-semibold">{insights.report.passRate}%</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Average accuracy</p>
                    <p className="mt-1 text-xl font-semibold">{insights.report.averageAccuracy}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>
                    Ranking is based on best score, then earliest submission time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No submitted attempts yet. Rankings will appear after the first submission.
                    </p>
                  ) : (
                    insights.ranking.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {entry.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Rank #{entry.rank} · {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {entry.score}/{entry.totalMarks}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.percentage}%</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconHistory className="size-4 text-muted-foreground" />
                    Your history
                  </CardTitle>
                  <CardDescription>Latest attempts for this test.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attempts yet.</p>
                  ) : (
                    insights.history.map((attempt) => (
                      <Link
                        href={attempt.status === "in_progress" ? ctaHref : `/dashboard/tests/result/${attempt.attemptId}`}
                        key={attempt.attemptId}
                        className="flex flex-col gap-2 rounded-lg border bg-muted/15 p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={attempt.status === "in_progress" ? "outline" : "secondary"}>
                            {attempt.status?.replace("_", " ") ?? "Unknown"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(attempt.submittedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="font-medium">
                            {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
                          </p>
                          <p className="text-muted-foreground">
                            {attempt.rank ? `#${attempt.rank}` : "Not ranked"}
                          </p>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconClockHour4 className="size-3.5" />
                          Duration: {formatDurationSec(attempt.durationSec)}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href={ctaHref}>
              {ctaLabel}
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
