"use client";

import Link from "next/link";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleX,
  IconHistory,
  IconInfoCircle,
  IconTrophy,
  IconCalendarEvent,
  IconTarget,
  IconPercentage,
  IconMedal,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAttemptResult, useQuizInsights } from "@/features/tests/hooks";
import { cn } from "@/lib/utils";

const reportChartConfig = {
  count: {
    label: "Students",
    color: "hsl(var(--primary))",
  },
} as const;

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

export function ResultPage({ attemptId }: { attemptId: string }) {
  const resultQuery = useAttemptResult(attemptId);
  const quizId = resultQuery.data?.quizId ?? "";
  const insightsQuery = useQuizInsights(quizId);

  if (resultQuery.isLoading || (quizId && insightsQuery.isLoading)) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (resultQuery.error || !resultQuery.data) {
    const errorMessage = resultQuery.error instanceof Error
      ? resultQuery.error.message
      : "The assessment result could not be retrieved at this time.";

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <Card className="w-full max-w-md rounded-xl border-destructive/20 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <IconCircleX className="size-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">Result Unavailable</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/tests">Return to Tests Dashboard</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = resultQuery.data;
  const insights = insightsQuery.data;
  const isPassed = result.score >= result.passingMarks;
  const attemptedCount = result.correctCount + result.incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((result.correctCount / attemptedCount) * 100) : 0;
  const scorePercent = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const rank = result.rank;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-5 md:p-8">
      {/* 1. Header Area */}
      <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="/dashboard/tests" className="flex items-center gap-1 hover:text-primary transition-colors">
              <IconArrowLeft className="size-3.5" />
              Tests
            </Link>
            <span>•</span>
            <span className="truncate">{insights?.about.courseName ?? "Assessment"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl leading-snug line-clamp-2">
            {result.quizTitle}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium gap-1.5 bg-background">
            <IconCalendarEvent className="size-3.5 text-muted-foreground" />
            {formatDate(result.submittedAt)}
          </Badge>
          <Badge
            variant={isPassed ? "default" : "destructive"}
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
              isPassed ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : "bg-destructive/10 text-destructive hover:bg-destructive/10"
            )}
          >
            {isPassed ? "Passed" : "Failed"}
          </Badge>
        </div>
      </div>

      {/* 2. Premium Hero Card */}
      <Card className="rounded-xl border-border/60 bg-muted/5 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

            {/* Circular Progress Indicator */}
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div className="relative flex size-32 items-center justify-center">
                <svg className="absolute inset-0 size-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${scorePercent * 2.76} 276`}
                    className={isPassed ? "text-emerald-500" : "text-destructive"}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">{scorePercent}%</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Score</p>
            </div>

            <div className="h-px w-full bg-border/50 md:h-24 md:w-px" />

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconTarget className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Marks</span>
                </div>
                <p className="text-2xl font-bold leading-none mt-1">
                  {result.score}<span className="text-sm font-medium text-muted-foreground">/{result.totalMarks}</span>
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCircleCheck className="size-4 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Correct</span>
                </div>
                <p className="text-2xl font-bold leading-none mt-1">{result.correctCount}</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCircleX className="size-4 text-destructive" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Incorrect</span>
                </div>
                <p className="text-2xl font-bold leading-none mt-1">{result.incorrectCount}</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconPercentage className="size-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
                </div>
                <p className="text-2xl font-bold leading-none mt-1">{accuracy}%</p>
              </div>
            </div>

            {/* Rank display if available */}
            {rank != null && (
              <div className="hidden lg:flex shrink-0 flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4">
                <IconMedal className="size-8 text-amber-500 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600/80">Class Rank</p>
                <p className="text-3xl font-extrabold text-amber-500">#{rank}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Refined Tabs */}
      <Tabs defaultValue="review" className="w-full">
        <TabsList className="w-full justify-start border-b border-border/50 bg-transparent h-12 p-0 mb-6 gap-6 overflow-x-auto rounded-none">
          <TabsTrigger
            value="review"
            className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
          >
            Review Questions
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
          >
            Class Overview
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
          >
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6 outline-none mt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Detailed Review</h2>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <IconCircleCheck className="size-4" />
                <span>{result.correctCount} Correct</span>
              </div>
              <div className="flex items-center gap-1.5 text-destructive">
                <IconCircleX className="size-4" />
                <span>{result.incorrectCount} Incorrect</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {result.review.map((item, index) => (
              <div key={item.questionId} className="flex flex-col gap-3 py-6 border-b border-border/40 last:border-0">

                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium leading-relaxed text-foreground">
                    <span className="text-muted-foreground font-normal mr-3">{index + 1}.</span>
                    {item.question}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.marks} mark{item.marks !== 1 && "s"}
                    </span>
                    <Badge variant="outline" className={cn(
                      "px-2 py-0 text-[10px] uppercase font-bold tracking-wider border-transparent shadow-none",
                      item.isCorrect ? "text-emerald-500 bg-emerald-500/10" : "text-destructive bg-destructive/10"
                    )}>
                      {item.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                </div>

                {/* Answers Stack */}
                <div className="flex flex-col gap-2 pl-7 mt-2">

                  {/* User's Answer */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground w-28 shrink-0">Your Answer:</span>
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <IconCircleCheck className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <IconCircleX className="mt-0.5 size-4 text-destructive shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        item.isCorrect ? "text-foreground" : "text-destructive"
                      )}>
                        {item.selectedOptionText ?? "Not Answered"}
                      </span>
                    </div>
                  </div>

                  {/* Correct Answer (if user was wrong) */}
                  {!item.isCorrect && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground w-28 shrink-0">Correct Answer:</span>
                      <div className="flex items-start gap-2">
                        <IconCircleCheck className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {item.correctOptionText ?? "Not Available"}
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="mt-4 ml-7 rounded-lg border border-border/40 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <IconInfoCircle className="size-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explanation</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 outline-none mt-2">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Attempt Details Column */}
            <div className="flex flex-col gap-6 lg:w-1/3">
              <Card className="rounded-xl border-border/60 shadow-sm h-full">
                <CardHeader className="p-5 pb-4">
                  <CardTitle className="text-base font-semibold">Attempt Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col divide-y divide-border/50 text-sm">
                    <div className="flex items-center justify-between p-5 py-3.5">
                      <span className="font-medium text-muted-foreground">Status</span>
                      <span className="font-semibold capitalize">{result.status.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 py-3.5">
                      <span className="font-medium text-muted-foreground">Time Taken</span>
                      <span className="font-semibold">{formatDurationSec(result.durationSec)}</span>
                    </div>
                    <div className="flex items-center justify-between p-5 py-3.5">
                      <span className="font-medium text-muted-foreground">Passing Required</span>
                      <span className="font-semibold">{result.passingMarks} / {result.totalMarks} marks</span>
                    </div>
                    <div className="flex items-center justify-between p-5 py-3.5">
                      <span className="font-medium text-muted-foreground">Unanswered</span>
                      <span className="font-semibold text-destructive">{result.review.length - attemptedCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Column */}
            <div className="flex flex-col gap-6 lg:w-2/3">
              <Card className="rounded-xl border-border/60 shadow-sm h-full">
                <CardHeader className="p-5 pb-4">
                  <CardTitle className="text-base font-semibold">Class Distribution</CardTitle>
                  <CardDescription className="text-xs">How students performed across score brackets.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {insights ? (
                    <div className="flex flex-col gap-4 mt-2">
                      <ChartContainer config={reportChartConfig} className="h-[220px] w-full">
                        <BarChart data={insights.report.distribution} margin={{ left: -25, top: 10, right: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-muted/50" />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} className="fill-muted-foreground" />
                          <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} className="fill-muted-foreground" />
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm font-medium text-muted-foreground bg-muted/10 rounded-lg">
                      Loading distribution...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6 outline-none mt-2">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 rounded-xl border-border/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 p-5 bg-card">
                <div>
                  <CardTitle className="text-base font-semibold">Class Leaderboard</CardTitle>
                  <CardDescription className="mt-1 text-xs">Global ranking based on highest scores</CardDescription>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {insights?.ranking.map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="flex size-8 shrink-0 items-center justify-center">
                          {entry.rank <= 3 ? (
                            <IconMedal className={cn(
                              "size-6",
                              entry.rank === 1 ? "text-amber-500" : entry.rank === 2 ? "text-zinc-400" : "text-amber-700"
                            )} />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                          )}
                        </div>
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                          {entry.initials}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight">{entry.name}</p>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
                            {entry.durationSec ? ` · ${formatDurationSec(entry.durationSec)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 ml-4">
                        <p className="text-sm font-bold leading-none">{entry.score}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">/ {entry.totalMarks}</span></p>
                        <p className="text-[11px] font-bold text-emerald-500">{entry.percentage}%</p>
                      </div>
                    </div>
                  )) ?? (
                      <div className="p-10 text-center text-sm font-medium text-muted-foreground">
                        No participants yet.
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden h-fit">
              <div className="flex items-center gap-2 border-b border-border/40 p-5 bg-card">
                <IconHistory className="size-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Your History</CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {insights?.history.map((histAttempt) => (
                    <div key={histAttempt.attemptId} className="flex flex-col gap-3 p-5 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={cn(
                          "capitalize text-[10px] font-bold tracking-widest px-2",
                          histAttempt.status === "submitted" ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10" : "bg-muted/20"
                        )}>
                          {histAttempt.status.replace("_", " ")}
                        </Badge>
                        <span className="text-[11px] font-medium text-muted-foreground">{formatDate(histAttempt.submittedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-bold">
                          {histAttempt.score}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">/ {histAttempt.totalMarks}</span>
                        </p>
                        {histAttempt.rank && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                            Rank
                            <span className="text-foreground text-sm">#{histAttempt.rank}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )) ?? (
                      <div className="p-8 text-center text-sm font-medium text-muted-foreground">
                        No previous attempts.
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
