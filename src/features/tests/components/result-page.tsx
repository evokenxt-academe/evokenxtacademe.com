"use client";

import Link from "next/link";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconCircleX,
  IconFileDescription,
  IconHistory,
  IconInfoCircle,
  IconReport,
  IconTrophy,
  IconChevronRight,
  IconLayoutDashboard,
  IconCalendarEvent
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { useAttemptResult, useQuizInsights } from "@/features/tests/hooks";

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

const HeaderDecorator = () => (
  <div className="pointer-events-none absolute inset-0 z-10">
    <span className="absolute -left-px -top-px block size-4 border-l-2 border-t-2 border-primary/40"></span>
    <span className="absolute -right-px -bottom-px block size-4 border-r-2 border-b-2 border-primary/40"></span>
  </div>
);

export function ResultPage({ attemptId }: { attemptId: string }) {
  const resultQuery = useAttemptResult(attemptId);
  const quizId = resultQuery.data?.quizId ?? "";
  const insightsQuery = useQuizInsights(quizId);

  if (resultQuery.isLoading || (quizId && insightsQuery.isLoading)) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-[600px] w-full rounded-none" />
      </div>
    );
  }

  if (!resultQuery.data || resultQuery.error) {
    return (
      <div className="p-4 md:p-6">
        <div className="border border-border/40 bg-card p-8">
          <h2 className="text-xl font-black uppercase tracking-widest">Result unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {resultQuery.error instanceof Error ? resultQuery.error.message : "Unable to load result."}
          </p>
        </div>
      </div>
    );
  }

  const result = resultQuery.data;
  const insights = insightsQuery.data;
  const isPassed = result.score >= result.passingMarks;
  const attemptedCount = result.correctCount + result.incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((result.correctCount / attemptedCount) * 100) : 0;
  const completion = result.review.length > 0 ? Math.round((attemptedCount / result.review.length) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6 lg:p-8">
      {/* ── Premium Header Section ────────────────────────────────── */}
      <section className="relative overflow-hidden border border-border/40 bg-linear-to-br from-background via-muted/5 to-primary/[0.03] dark:from-background dark:via-muted/10 dark:to-primary/5 rounded-none">
        <HeaderDecorator />
        
        {/* Background Accents */}
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-blue-500/[0.03] blur-3xl" />
        
        <div className="relative p-6 md:p-10 border-b border-border/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <IconLayoutDashboard className="size-3.5" />
                <span>Assessment Result</span>
                <IconChevronRight className="size-3 text-muted-foreground/30" />
                <span className="text-muted-foreground">{insights?.about.courseName}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground max-w-3xl leading-[1.1]">
                {result.quizTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <IconCalendarEvent className="size-4 text-primary/60" />
                  <span>{formatDate(result.submittedAt)}</span>
                </div>
                <div className="h-4 w-px bg-border/40" />
                <div className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{result.status.replace("_", " ").toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 min-w-[200px]">
              <div className={`inline-flex items-center rounded-none px-8 py-2.5 text-xs font-black uppercase tracking-[0.3em] shadow-2xl ${
                isPassed ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-destructive text-destructive-foreground shadow-destructive/20'
              }`}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                PASSING GRADE: <span className="text-foreground ml-1">{result.passingMarks} PTS</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/40">
          <div className="p-6 md:p-10 flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Final Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-foreground">{result.score}</span>
              <span className="text-sm font-bold text-muted-foreground">/ {result.totalMarks}</span>
            </div>
          </div>
          <div className="p-6 md:p-10 flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Accuracy</span>
            <span className="text-4xl font-black text-foreground">{accuracy}%</span>
          </div>
          <div className="p-6 md:p-10 flex flex-col gap-3 border-t lg:border-t-0 border-border/40">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Correct</span>
            <span className="text-4xl font-black text-foreground">{result.correctCount}</span>
          </div>
          <div className="p-6 md:p-10 flex flex-col gap-3 border-t lg:border-t-0 border-border/40">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Completion</span>
            <span className="text-4xl font-black text-foreground">{completion}%</span>
          </div>
        </div>
      </section>

      {/* ── Tabs & Content Section ────────────────────────────────── */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="h-auto w-full justify-start gap-4 bg-transparent p-0 mb-8 border-b border-border/40 rounded-none overflow-x-auto">
          <TabsTrigger 
            value="about" 
            className="rounded-none border-b-2 border-transparent px-8 py-4 text-xs font-black uppercase tracking-[0.2em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="report" 
            className="rounded-none border-b-2 border-transparent px-8 py-4 text-xs font-black uppercase tracking-[0.2em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
          >
            Question Review
          </TabsTrigger>
          <TabsTrigger 
            value="ranking" 
            className="rounded-none border-b-2 border-transparent px-8 py-4 text-xs font-black uppercase tracking-[0.2em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all"
          >
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ────────────────────────────────────────── */}
        <TabsContent value="about" className="mt-0 space-y-8 outline-none">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="border border-border/40 bg-card/40 p-8 space-y-8 rounded-2xl shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-6">Attempt Parameters</h4>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submission Status</span>
                  <span className="text-sm font-black text-foreground">{result.status.toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Answered Questions</span>
                  <span className="text-sm font-black text-foreground">{attemptedCount} / {result.review.length}</span>
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Associated Course</span>
                  <span className="text-sm font-black text-foreground">{insights?.about.courseName ?? "—"}</span>
                </div>
              </div>
              <Separator className="bg-border/20" />
              <Button asChild variant="outline" className="w-full rounded-xl h-12 text-[11px] font-black uppercase tracking-widest border-border/60 hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all">
                <Link href="/dashboard/tests">
                  <IconArrowLeft className="mr-2 size-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>

            <div className="border border-border/40 bg-card/40 p-8 flex flex-col justify-between rounded-2xl shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-6">Quick Insights</h4>
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/5 border border-border/20">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xl font-black text-foreground">{accuracy}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Performance</span>
                  </div>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <IconReport className="size-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/5 border border-border/20">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xl font-black text-foreground">{insights?.report.passRate ?? "—"}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global Pass Rate</span>
                  </div>
                  <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <IconTrophy className="size-6 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Review Tab ──────────────────────────────────────────── */}
        <TabsContent value="report" className="mt-0 space-y-10 outline-none">
          <div className="grid gap-8 xl:grid-cols-2">
            <div className="border border-border/40 bg-card/40 p-8 overflow-hidden rounded-2xl shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-8">Score Distribution</h4>
              {insights ? (
                <ChartContainer config={reportChartConfig} className="h-72 w-full">
                  <BarChart data={insights.report.distribution} margin={{ left: -20, top: 20 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis 
                      dataKey="label" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fontWeight: 800, fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fontWeight: 800, fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel className="rounded-xl border-border/40 shadow-xl" />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {insights.report.distribution.map((bucket, index) => (
                        <Cell key={index} fill="hsl(var(--primary))" fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-72 items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                  Data processing in progress...
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Avg. Score", value: insights?.report.averageScore ?? "—" },
                { label: "Highest Score", value: insights?.report.highestScore ?? "—" },
                { label: "Avg. Accuracy", value: (insights?.report.averageAccuracy ?? "—") + "%" },
                { label: "Total Students", value: insights?.report.participants ?? "—" },
              ].map((stat, i) => (
                <div key={i} className="bg-card/40 p-8 flex flex-col gap-3 rounded-2xl border border-border/30 shadow-sm transition-all hover:border-primary/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                  <span className="text-2xl font-black text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
              Detailed Analysis
            </h4>
            <div className="grid gap-8">
              {result.review.map((item, index) => (
                <div key={item.questionId} className="border border-border/40 bg-card/40 group overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-lg hover:border-border/60">
                  <div className="p-6 md:p-10 flex flex-col gap-8">
                    <div className="flex items-start justify-between gap-6">
                      <h5 className="text-base md:text-lg font-bold leading-relaxed text-foreground">
                        <span className="text-primary font-black mr-4 text-xl">Q{index + 1}.</span>
                        {item.question}
                      </h5>
                      <Badge variant={item.isCorrect ? "default" : "outline"} className="rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest shrink-0">
                        {item.isCorrect ? item.marks : 0}/{item.marks} PTS
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-xl border-l-4 ${item.isCorrect ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5 shadow-inner'}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Your Submission</span>
                        <div className="flex items-center gap-4">
                          {item.isCorrect ? <IconCircleCheck className="size-6 text-emerald-500" /> : <IconCircleX className="size-6 text-red-500" />}
                          <span className="text-base font-bold text-foreground">{item.selectedOptionText ?? "NOT ANSWERED"}</span>
                        </div>
                      </div>
                      {!item.isCorrect && (
                        <div className="p-6 rounded-xl border-l-4 border-primary bg-primary/5 shadow-inner">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Correct Solution</span>
                          <div className="flex items-center gap-4">
                            <IconCircleCheck className="size-6 text-primary" />
                            <span className="text-base font-bold text-foreground">{item.correctOptionText ?? "NOT AVAILABLE"}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {item.explanation && (
                      <div className="mt-2 p-6 bg-muted/20 border border-border/30 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1.5 bg-primary/30" />
                        <div className="flex items-center gap-3 mb-4">
                          <IconInfoCircle className="size-5 text-primary" />
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Academic Insight</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground font-medium italic pl-2">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Leaderboard Tab ────────────────────────────────────── */}
        <TabsContent value="ranking" className="mt-0 outline-none space-y-8">
          <div className="grid lg:grid-cols-[1fr_0.4fr] gap-8">
            <div className="border border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border/40 bg-muted/5">
                <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary">Global Leaderboard</h4>
              </div>
              <div className="divide-y divide-border/30">
                {insights?.ranking.map((entry) => (
                  <div key={entry.userId} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all group/row">
                    <div className="flex items-center gap-5">
                      <div className="size-12 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center text-xs font-black text-muted-foreground group-hover/row:border-primary group-hover/row:text-primary transition-all">
                        {entry.initials}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{entry.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1">Rank Position #{entry.rank}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1.5">
                      <span className="text-base font-black text-foreground">{entry.score} <span className="text-xs text-muted-foreground">/ {entry.totalMarks}</span></span>
                      <Badge variant="secondary" className="rounded-lg text-[9px] font-bold uppercase tracking-widest">{entry.percentage}% ACCURACY</Badge>
                    </div>
                  </div>
                )) ?? <div className="p-16 text-center italic text-muted-foreground uppercase tracking-widest text-[10px] font-black">Waiting for participants...</div>}
              </div>
            </div>

            <div className="border border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border/40 bg-muted/5">
                <h4 className="text-xs font-black uppercase tracking-[0.25em] text-primary flex items-center gap-3">
                  <IconHistory className="size-5" />
                  Attempt History
                </h4>
              </div>
              <div className="divide-y divide-border/30">
                {insights?.history.map((attempt) => (
                  <div key={attempt.attemptId} className="p-6 flex flex-col gap-4 hover:bg-primary/5 transition-all">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="rounded-lg border-primary/40 text-[9px] font-black uppercase tracking-widest px-2">{attempt.status.toUpperCase()}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground">{formatDate(attempt.submittedAt)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-black text-foreground">{attempt.score}/{attempt.totalMarks} <span className="text-[11px] font-bold text-muted-foreground">({attempt.percentage}%)</span></p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Global Position #{attempt.rank ?? "—"}</p>
                    </div>
                  </div>
                )) ?? <div className="p-16 text-center italic text-muted-foreground uppercase tracking-widest text-[10px] font-black">No previous attempts</div>}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
