"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconHistory,
  IconInfoCircle,
  IconTrophy,
  IconCalendarEvent,
  IconTarget,
  IconPercentage,
  IconMedal,
  IconUsers,
  IconTrendingUp,
  IconAward,
  IconClock,
  IconChevronRight,
  IconHelpCircle,
  IconAlertCircle,
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
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");
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

  // Filter calculations for review tab
  const correctReviewCount = result.review.filter((q) => q.selectedOptionId && q.isCorrect).length;
  const incorrectReviewCount = result.review.filter((q) => q.selectedOptionId && !q.isCorrect).length;
  const unansweredReviewCount = result.review.filter((q) => !q.selectedOptionId).length;
  const totalReviewCount = result.review.length;

  const filteredReview = result.review.filter((q) => {
    if (reviewFilter === "correct") return q.selectedOptionId && q.isCorrect;
    if (reviewFilter === "incorrect") return q.selectedOptionId && !q.isCorrect;
    if (reviewFilter === "unanswered") return !q.selectedOptionId;
    return true;
  });

  // Feedback message based on score accuracy
  let performanceFeedback = "Keep studying! Review the explanation for each question to improve.";
  if (accuracy >= 90) {
    performanceFeedback = "Outstanding performance! You have fully mastered this assessment.";
  } else if (accuracy >= 75) {
    performanceFeedback = "Great job! You have a solid grasp of this material.";
  } else if (accuracy >= 50) {
    performanceFeedback = "Good effort! A review of the incorrect topics will help you improve further.";
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-5 md:p-8 animate-in fade-in duration-300">
      {/* 1. Header Area with dynamic pass/fail premium styles */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-sm transition-all duration-300",
          isPassed
            ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.02] to-transparent"
            : "border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-rose-500/[0.02] to-transparent"
        )}
      >
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 min-w-0">
            <Link
              href="/dashboard/tests"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
            >
              <IconArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Assessments
            </Link>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                {insights?.about.courseName ?? "Assessment Result"}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl leading-snug">
                {result.quizTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-background/60 border border-border/40 px-3.5 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              <IconCalendarEvent className="size-4 text-muted-foreground" />
              <span>Submitted: {formatDate(result.submittedAt)}</span>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm",
                isPassed
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {isPassed ? (
                <IconCircleCheck className="size-4 shrink-0" />
              ) : (
                <IconCircleX className="size-4 shrink-0" />
              )}
              <span>{isPassed ? "Passed" : "Failed"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Premium Performance Hero Card */}
      <Card className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-md backdrop-blur-md">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-10">
            {/* Circular Progress Gauge */}
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div className="relative flex size-36 items-center justify-center">
                <svg className="absolute inset-0 size-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted/40"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeDasharray={`${scorePercent * 2.64} 264`}
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      isPassed
                        ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : "text-rose-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {scorePercent}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                    Score
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block h-24 w-px bg-border/60" />

            {/* Performance Text & Stats */}
            <div className="flex-1 space-y-5 w-full">
              <div className="text-center lg:text-left space-y-1">
                <h2 className="text-lg font-bold text-foreground">Your Performance</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {performanceFeedback}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconTarget className="size-4 text-primary/80" />
                    <span className="text-xs font-bold uppercase tracking-wider">Marks</span>
                  </div>
                  <p className="text-2xl font-extrabold mt-1.5 text-foreground">
                    {result.score}
                    <span className="text-sm font-medium text-muted-foreground">/{result.totalMarks}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCircleCheck className="size-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Correct</span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">
                    {result.correctCount}
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCircleX className="size-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Incorrect</span>
                  </div>
                  <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1.5">
                    {result.incorrectCount}
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconPercentage className="size-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">
                    {accuracy}%
                  </p>
                </div>
              </div>
            </div>

            {/* Rank Card */}
            {rank != null && (
              <div
                className={cn(
                  "flex shrink-0 flex-col items-center justify-center rounded-2xl border px-6 py-5 w-full lg:w-44 text-center transition-all",
                  rank <= 3
                    ? "border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] text-amber-600 dark:text-amber-400 shadow-sm"
                    : "border-border bg-muted/10 text-muted-foreground"
                )}
              >
                <IconMedal className={cn("size-9 mb-2", rank <= 3 ? "text-amber-500 animate-bounce duration-1000" : "text-muted-foreground")} />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Class Rank</p>
                <p className={cn("text-4xl font-black mt-1", rank <= 3 ? "text-amber-500" : "text-foreground")}>
                  #{rank}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Refined Tabs */}
      <Tabs defaultValue="review" className="w-full">
        {/* Custom premium styled tab list (segmented design) */}
        <div className="flex justify-center md:justify-start mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger
              value="review"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Review
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Class Insights
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Review Tab ─────────────────────────────────────────── */}
        <TabsContent value="review" className="space-y-6 outline-none mt-2 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/50">
            <div>
              <h2 className="text-xl font-bold text-foreground">Detailed Questions Review</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Filter and check answers along with full explanations.</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReviewFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5",
                  reviewFilter === "all"
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/10"
                )}
              >
                All ({totalReviewCount})
              </button>
              <button
                onClick={() => setReviewFilter("correct")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5",
                  reviewFilter === "correct"
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-background text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/5"
                )}
              >
                <IconCircleCheck className="size-3.5" />
                Correct ({correctReviewCount})
              </button>
              <button
                onClick={() => setReviewFilter("incorrect")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5",
                  reviewFilter === "incorrect"
                    ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                    : "bg-background text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/5"
                )}
              >
                <IconCircleX className="size-3.5" />
                Incorrect ({incorrectReviewCount})
              </button>
              <button
                onClick={() => setReviewFilter("unanswered")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5",
                  reviewFilter === "unanswered"
                    ? "bg-zinc-500 text-white border-zinc-500 shadow-sm"
                    : "bg-background text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/5"
                )}
              >
                <IconHelpCircle className="size-3.5" />
                Unanswered ({unansweredReviewCount})
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {filteredReview.length > 0 ? (
              filteredReview.map((item, index) => (
                <Card
                  key={item.questionId}
                  className={cn(
                    "overflow-hidden border-l-4 transition-all duration-200 shadow-sm hover:shadow-md",
                    !item.selectedOptionId
                      ? "border-l-zinc-400 dark:border-l-zinc-600"
                      : item.isCorrect
                      ? "border-l-emerald-500 dark:border-l-emerald-600"
                      : "border-l-rose-500 dark:border-l-rose-600"
                  )}
                >
                  <CardContent className="p-6 space-y-5">
                    {/* Question header info */}
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/40 px-2 py-0.5 rounded-md">
                          {item.marks} mark{item.marks !== 1 && "s"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border-transparent shadow-none rounded-md",
                            !item.selectedOptionId
                              ? "text-zinc-500 bg-zinc-500/10"
                              : item.isCorrect
                              ? "text-emerald-500 bg-emerald-500/10"
                              : "text-rose-500 bg-rose-500/10"
                          )}
                        >
                          {!item.selectedOptionId ? "Unanswered" : item.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-base font-semibold leading-relaxed text-foreground">
                      {item.question}
                    </p>

                    {/* Selected and correct answers visual layout */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Student's Selection */}
                      <div
                        className={cn(
                          "rounded-xl border p-4 flex flex-col justify-between min-h-[90px] transition-all",
                          !item.selectedOptionId
                            ? "border-zinc-200 dark:border-zinc-800 bg-zinc-500/[0.02]"
                            : item.isCorrect
                            ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                            : "border-rose-500/20 bg-rose-500/[0.02]"
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          Your Choice
                        </span>
                        <div className="flex items-start gap-2.5">
                          {!item.selectedOptionId ? (
                            <>
                              <IconHelpCircle className="mt-0.5 size-4 text-zinc-400 shrink-0" />
                              <span className="text-sm font-medium text-zinc-500 italic">Not Answered</span>
                            </>
                          ) : item.isCorrect ? (
                            <>
                              <IconCircleCheck className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                              <span className="text-sm font-bold text-foreground leading-tight">
                                {item.selectedOptionText}
                              </span>
                            </>
                          ) : (
                            <>
                              <IconCircleX className="mt-0.5 size-4 text-rose-500 shrink-0" />
                              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight">
                                {item.selectedOptionText}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Correct Option (only displayed if incorrect or unanswered) */}
                      {(!item.selectedOptionId || !item.isCorrect) && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 flex flex-col justify-between min-h-[90px] transition-all">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                            Correct Solution
                          </span>
                          <div className="flex items-start gap-2.5">
                            <IconCircleCheck className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                            <span className="text-sm font-bold text-foreground leading-tight">
                              {item.correctOptionText ?? "Not Available"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanation details block */}
                    {item.explanation && (
                      <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.02] p-4 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <IconInfoCircle className="size-4 text-blue-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                            Explanation & Insights
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed pl-6">
                          {item.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
                <IconHelpCircle className="mx-auto size-10 text-muted-foreground/60 mb-3" />
                <p className="text-base font-bold text-foreground">No questions found</p>
                <p className="text-xs text-muted-foreground mt-1">There are no questions that match the selected filter.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Class Insights Tab ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 outline-none mt-2 animate-in fade-in duration-200">
          <div className="pb-4 border-b border-border/50">
            <h2 className="text-xl font-bold text-foreground">Class Performance Insights</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Compare your scores with other students in your cohort.</p>
          </div>

          {insights ? (
            <div className="space-y-6">
              {/* Class Metrics Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border-border/60 shadow-sm p-4">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <IconUsers className="size-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Cohort Size</span>
                  </div>
                  <p className="text-2xl font-black mt-3 text-foreground">
                    {insights.report.participants}
                    <span className="text-xs font-medium text-muted-foreground ml-1.5">Students</span>
                  </p>
                </Card>

                <Card className="rounded-xl border-border/60 shadow-sm p-4">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <IconTrendingUp className="size-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
                  </div>
                  <p className="text-2xl font-black mt-3 text-foreground">
                    {insights.report.averageScore}
                    <span className="text-sm font-semibold text-muted-foreground">/{insights.about.totalMarks}</span>
                  </p>
                </Card>

                <Card className="rounded-xl border-border/60 shadow-sm p-4">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <IconTrophy className="size-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Top Mark</span>
                  </div>
                  <p className="text-2xl font-black mt-3 text-foreground">
                    {insights.report.highestScore}
                    <span className="text-sm font-semibold text-muted-foreground">/{insights.about.totalMarks}</span>
                  </p>
                </Card>

                <Card className="rounded-xl border-border/60 shadow-sm p-4">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <IconAward className="size-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Pass Rate</span>
                  </div>
                  <p className="text-2xl font-black mt-3 text-foreground">
                    {insights.report.passRate}%
                  </p>
                </Card>
              </div>

              {/* Chart & Attempt Summary Split Layout */}
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left Panel - Attempt Details */}
                <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base font-bold text-foreground">Attempt Details</CardTitle>
                    <CardDescription className="text-xs">Summary of your personal test stats.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col divide-y divide-border/40 text-sm">
                      <div className="flex items-center justify-between p-5 py-3.5">
                        <span className="font-semibold text-muted-foreground">Status</span>
                        <Badge variant="outline" className="font-bold capitalize px-2 py-0.5 rounded-md border-border/60">
                          {result.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-5 py-3.5">
                        <span className="font-semibold text-muted-foreground">Time Taken</span>
                        <span className="font-bold text-foreground">{formatDurationSec(result.durationSec)}</span>
                      </div>
                      <div className="flex items-center justify-between p-5 py-3.5">
                        <span className="font-semibold text-muted-foreground">Passing Marks</span>
                        <span className="font-bold text-foreground">{result.passingMarks} / {result.totalMarks}</span>
                      </div>
                      <div className="flex items-center justify-between p-5 py-3.5">
                        <span className="font-semibold text-muted-foreground">Unanswered</span>
                        <span className="font-bold text-rose-500">{unansweredReviewCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Panel - Score Distribution Chart */}
                <Card className="lg:col-span-3 rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base font-bold text-foreground">Class Score Distribution</CardTitle>
                    <CardDescription className="text-xs">Number of students within each score range.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="h-[220px] w-full mt-2">
                      <ChartContainer config={reportChartConfig} className="h-full w-full">
                        <BarChart data={insights.report.distribution} margin={{ left: -25, top: 10, right: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} className="fill-muted-foreground font-semibold" />
                          <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} className="fill-muted-foreground font-semibold" />
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="count" radius={[5, 5, 0, 0]} className="fill-primary" />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
              <IconAlertCircle className="mx-auto size-10 text-muted-foreground/60 mb-3" />
              <p className="text-base font-bold text-foreground">Insights Unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">Class overview statistics are not available at this moment.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Leaderboard Tab ────────────────────────────────────── */}
        <TabsContent value="ranking" className="space-y-6 outline-none mt-2 animate-in fade-in duration-200">
          <div className="pb-4 border-b border-border/50">
            <h2 className="text-xl font-bold text-foreground">Class Leaderboard & History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Rankings based on highest scores and past attempts.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Class Leaderboard */}
            <Card className="lg:col-span-3 rounded-2xl border-border/50 shadow-sm overflow-hidden h-fit">
              <div className="border-b border-border/40 p-5 bg-card/60">
                <CardTitle className="text-base font-bold">Class Leaderboard</CardTitle>
                <CardDescription className="mt-1 text-xs">Global student rankings for this quiz</CardDescription>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {insights?.ranking && insights.ranking.length > 0 ? (
                    insights.ranking.map((entry) => {
                      const isCurrentUser = entry.userId === result.userId;
                      return (
                        <div
                          key={entry.userId}
                          className={cn(
                            "flex items-center justify-between px-5 py-4 transition-all",
                            isCurrentUser
                              ? "bg-primary/[0.04] border-y border-primary/10 ring-1 ring-primary/5"
                              : "hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Rank Number or Medal */}
                            <div className="flex size-8 shrink-0 items-center justify-center">
                              {entry.rank <= 3 ? (
                                <IconMedal
                                  className={cn(
                                    "size-6 drop-shadow-sm",
                                    entry.rank === 1
                                      ? "text-amber-500"
                                      : entry.rank === 2
                                      ? "text-slate-400"
                                      : "text-amber-700"
                                  )}
                                />
                              ) : (
                                <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                              )}
                            </div>

                            {/* Initials Avatar */}
                            <div
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1",
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground ring-primary/30"
                                  : "bg-primary/10 text-primary ring-primary/20"
                              )}
                            >
                              {entry.initials}
                            </div>

                            {/* User details */}
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <p className="truncate text-sm font-bold text-foreground flex items-center gap-1.5">
                                <span className="truncate">{entry.name}</span>
                                {isCurrentUser && (
                                  <Badge className="px-1.5 py-0 text-[9px] uppercase font-extrabold tracking-wider bg-primary/20 text-primary border-transparent hover:bg-primary/20 rounded-md">
                                    You
                                  </Badge>
                                )}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground truncate">
                                {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
                                {entry.durationSec ? ` · ${formatDurationSec(entry.durationSec)}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-0.5 shrink-0 ml-4">
                            <p className="text-sm font-extrabold text-foreground">
                              {entry.score}
                              <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">
                                / {entry.totalMarks}
                              </span>
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {entry.percentage}%
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                      No participants registered yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attempt History */}
            <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm overflow-hidden h-fit">
              <div className="flex items-center gap-2 border-b border-border/40 p-5 bg-card/60">
                <IconHistory className="size-4 text-muted-foreground" />
                <CardTitle className="text-base font-bold">Your History</CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {insights?.history && insights.history.length > 0 ? (
                    insights.history.map((histAttempt) => {
                      const isCurrentAttempt = histAttempt.attemptId === attemptId;
                      const isInProgress = histAttempt.status === "in_progress";
                      const href = isInProgress
                        ? `/dashboard/quiz/${quizId}`
                        : `/dashboard/tests/result/${histAttempt.attemptId}`;

                      return (
                        <Link
                          key={histAttempt.attemptId}
                          href={href}
                          className={cn(
                            "flex flex-col gap-3.5 p-5 hover:bg-muted/15 transition-all group cursor-pointer relative",
                            isCurrentAttempt && "bg-muted/5 border-l-4 border-l-primary"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-md",
                                  histAttempt.status === "submitted"
                                    ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/10"
                                    : "bg-muted/20 text-muted-foreground"
                                )}
                              >
                                {histAttempt.status.replace("_", " ")}
                              </Badge>
                              {isCurrentAttempt && (
                                <Badge className="px-1.5 py-0 text-[9px] font-extrabold uppercase bg-primary text-primary-foreground border-transparent hover:bg-primary rounded-md">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {formatDate(histAttempt.submittedAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm font-black text-foreground">
                              {histAttempt.score}
                              <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">
                                / {histAttempt.totalMarks}
                              </span>
                            </p>

                            {histAttempt.rank ? (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                                Rank
                                <span className="text-foreground font-black text-sm">#{histAttempt.rank}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                <span>Details</span>
                                <IconChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-sm font-medium text-muted-foreground">
                      No previous attempts found.
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
