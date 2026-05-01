"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconClockHour4,
  IconFileDescription,
  IconHistory,
  IconTrophy,
  IconTarget,
  IconMedal,
  IconUsers,
  IconPercentage,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      <div className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-6">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!quizQuery.data || !insightsQuery.data || quizQuery.error || insightsQuery.error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-5 md:p-6">
        <Card className="rounded-xl">
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
  const ctaLabel = inProgressAttempt ? "Continue Test" : "Start Test";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 md:p-6">
      {/* Header Card */}
      <Card className="rounded-xl border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{quiz.courseName}</Badge>
              <Badge variant="outline">{quiz.sectionTitle}</Badge>
            </div>
            <Badge variant={inProgressAttempt ? "secondary" : "outline"}>
              {inProgressAttempt ? "In Progress" : "Not Attempted"}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl md:text-3xl">{quiz.title}</CardTitle>
            <CardDescription className="max-w-3xl text-sm md:text-base">
              {quiz.description ?? "Review details before starting your test."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <IconFileDescription className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions</p>
              <p className="mt-0.5 text-xl font-semibold">{insights.about.questionCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <IconTarget className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Marks</p>
              <p className="mt-0.5 text-xl font-semibold">{insights.about.totalMarks}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <IconTrophy className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass Marks</p>
              <p className="mt-0.5 text-xl font-semibold">{insights.about.passingMarks}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconClockHour4 className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Limit</p>
              <p className="mt-0.5 text-lg font-semibold">{formatDuration(insights.about.timeLimitSec)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="about" className="flex flex-col gap-4">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 overflow-x-auto">
          <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5">
            <IconFileDescription className="size-4" />
            About
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5">
            <IconPercentage className="size-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="ranking" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 gap-1.5">
            <IconTrophy className="size-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="mt-0">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Assessment Overview</CardTitle>
              <CardDescription>
                Keep this page as your quick reference before you begin the test.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1fr_280px]">
              <div className="flex flex-col gap-4 rounded-xl border bg-muted/10 p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insights.about.description ?? "No additional instructions were provided for this test."}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Course</p>
                    <p className="text-muted-foreground">{insights.about.courseName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Section</p>
                    <p className="text-muted-foreground">{insights.about.sectionTitle}</p>
                  </div>
                  <div>
                    <p className="font-medium">Attempts Logged</p>
                    <p className="text-muted-foreground">{insights.report.attempts}</p>
                  </div>
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-muted-foreground">{insights.report.participants}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border bg-background p-5">
                <p className="text-sm font-medium">Ready to start?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Start a fresh attempt or resume your in-progress test. Progress is saved automatically.
                </p>
                <Button asChild className="w-full gap-2">
                  <Link href={ctaHref}>
                    {ctaLabel}
                    <IconArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
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

            <div className="grid grid-cols-2 gap-4 self-start">
              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <IconTarget className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Avg Score</p>
                    <p className="text-lg font-bold">{insights.report.averageScore}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <IconTrophy className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Highest</p>
                    <p className="text-lg font-bold">{insights.report.highestScore}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <IconPercentage className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pass Rate</p>
                    <p className="text-lg font-bold">{insights.report.passRate}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconUsers className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Accuracy</p>
                    <p className="text-lg font-bold">{insights.report.averageAccuracy}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  Ranking is based on best score, then earliest submission time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {insights.ranking.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <IconTrophy className="mb-3 size-8 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">
                        No submitted attempts yet. Rankings will appear after the first submission.
                      </p>
                    </div>
                  ) : (
                    insights.ranking.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                            {entry.rank <= 3 ? (
                              <IconMedal className={`size-4 ${entry.rank === 1 ? "text-amber-500" : entry.rank === 2 ? "text-zinc-400" : "text-amber-700"}`} />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">{entry.rank}</span>
                            )}
                          </div>
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {entry.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
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
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconHistory className="size-4 text-muted-foreground" />
                  Your History
                </CardTitle>
                <CardDescription>Latest attempts for this test.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No attempts yet.</p>
                ) : (
                  insights.history.map((attempt) => (
                    <Link
                      href={attempt.status === "in_progress" ? ctaHref : `/dashboard/tests/result/${attempt.attemptId}`}
                      key={attempt.attemptId}
                      className="flex flex-col gap-2 rounded-xl border bg-muted/10 p-3.5 transition-colors hover:bg-muted/25"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={attempt.status === "in_progress" ? "outline" : "secondary"} className="capitalize text-xs">
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

      {/* Bottom CTA */}
      <div className="flex justify-end">
        <Button asChild variant="outline" className="gap-2">
          <Link href={ctaHref}>
            {ctaLabel}
            <IconArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
