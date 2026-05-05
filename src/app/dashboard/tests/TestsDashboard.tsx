"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ClipboardList, Eye, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TestAttempt } from "@/types/tests";

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(a: TestAttempt) {
  if (a.status === "in_progress") return "In Progress";
  if (a.status === "timed_out") return "Timed Out";
  return a.isPassed ? "Passed" : "Failed";
}

function getStatusClasses(a: TestAttempt) {
  if (a.status === "in_progress")
    return "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400";
  if (a.status === "timed_out")
    return "border-border text-muted-foreground bg-muted";
  if (a.isPassed)
    return "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400";
  return "border-red-500/40 text-red-600 bg-red-500/10 dark:text-red-400";
}

function getTypeBadgeClasses(type: TestAttempt["quizzes"]["type"]) {
  switch (type) {
    case "practice":
      return "border-border text-muted-foreground";
    case "graded":
      return "border-blue-500/40 text-blue-600 bg-blue-500/10 dark:text-blue-400";
    case "final":
      return "border-violet-500/40 text-violet-600 bg-violet-500/10 dark:text-violet-400";
  }
}

// ── Chart Config ─────────────────────────────────────────────────

const chartConfig = {
  score: {
    label: "Score %",
    color: "#22c55e",
  },
  passing: {
    label: "Pass Mark %",
    color: "#ef4444",
  },
} satisfies ChartConfig;

// ── Stat Card ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBgClass,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconClass: string;
}) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
          >
            <Icon className={`size-5 ${iconClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Attempt Card ─────────────────────────────────────────────────

function AttemptCard({ attempt }: { attempt: TestAttempt }) {
  const isSubmitted = attempt.status === "submitted";

  return (
    <Card className="border-border/50 shadow-none transition-colors hover:border-border">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {attempt.quizzes.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] capitalize ${getTypeBadgeClasses(attempt.quizzes.type)}`}
                >
                  {attempt.quizzes.type}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {attempt.courseName}
              </p>
            </div>
          </div>

          {/* Score + Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Score:{" "}
                <span className="font-semibold text-foreground">
                  {isSubmitted ? attempt.score : "—"}
                </span>
                <span className="text-muted-foreground/60">
                  {" "}
                  / {attempt.total_marks}
                </span>
              </span>
              {isSubmitted && (
                <span
                  className={`text-xs font-medium ${
                    attempt.isPassed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {attempt.scorePercent}%
                </span>
              )}
            </div>
            <Progress
              value={isSubmitted ? attempt.scorePercent : 0}
              className={`h-1.5 bg-muted ${
                isSubmitted
                  ? attempt.isPassed
                    ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                    : "[&>[data-slot=progress-indicator]]:bg-red-500"
                  : "[&>[data-slot=progress-indicator]]:bg-muted-foreground/30"
              }`}
            />
          </div>

          {/* Footer: Status + Date + Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${getStatusClasses(attempt)}`}
              >
                {getStatusLabel(attempt)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(attempt.submitted_at ?? attempt.started_at)}
              </span>
            </div>

            {isSubmitted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Eye className="size-3" />
                Review Answers
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Score Trend Chart ────────────────────────────────────────────

function ScoreTrendChart({ attempts }: { attempts: TestAttempt[] }) {
  const chartData = useMemo(() => {
    return [...attempts]
      .filter((a) => a.status === "submitted")
      .reverse()
      .slice(-10)
      .map((a, i) => ({
        attempt: `#${i + 1}`,
        score: a.scorePercent,
        passing: a.passingPercent,
        quiz: a.quizzes.title,
      }));
  }, [attempts]);

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50 shadow-none">
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Complete a test to see your score trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Score Trend
          </h3>
          <span className="text-xs text-muted-foreground">
            — Last 10 attempts
          </span>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#22c55e"
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor="#22c55e"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/40"
            />
            <XAxis
              dataKey="attempt"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.quiz ?? "";
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#greenFill)"
              dot={{
                r: 3.5,
                fill: "#22c55e",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "var(--background)",
                fill: "#22c55e",
              }}
            />
            <Area
              type="monotone"
              dataKey="passing"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Empty State ──────────────────────────────────────────────────

function EmptyTabState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ClipboardList className="size-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No tests found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tests matching this filter will appear here.
        </p>
      </div>
    </div>
  );
}

function GlobalEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <ClipboardList className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        You haven&apos;t taken any tests yet.
      </p>
      <Button variant="outline" asChild>
        <Link href="/dashboard/courses">Browse Courses</Link>
      </Button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function TestsDashboard({ attempts }: { attempts: TestAttempt[] }) {
  // ── Compute stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalAttempts = attempts.length;
    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + a.scorePercent, 0) /
              attempts.length
          )
        : 0;
    const totalPassed = attempts.filter((a) => a.isPassed).length;
    const bestScore =
      attempts.length > 0
        ? Math.max(...attempts.map((a) => a.scorePercent))
        : 0;

    return { totalAttempts, avgScore, totalPassed, bestScore };
  }, [attempts]);

  // ── Filter by quiz type ───────────────────────────────────────
  const filterAttempts = (type: string) => {
    if (type === "all") return attempts;
    return attempts.filter((a) => a.quizzes.type === type);
  };

  // ── Global empty state ────────────────────────────────────────
  if (attempts.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My Tests
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your practice, graded, and final exams
          </p>
        </div>
        <GlobalEmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Tests
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your practice, graded, and final exams
        </p>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Attempts"
          value={String(stats.totalAttempts)}
          icon={ClipboardList}
          iconBgClass="bg-muted"
          iconClass="text-muted-foreground"
        />
        <StatCard
          label="Average Score"
          value={`${stats.avgScore}%`}
          icon={TrendingUp}
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
          iconClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Tests Passed"
          value={String(stats.totalPassed)}
          icon={Trophy}
          iconBgClass="bg-amber-50 dark:bg-amber-950/40"
          iconClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
          <TabsTrigger value="final">Final</TabsTrigger>
        </TabsList>

        {["all", "practice", "graded", "final"].map((tab) => {
          const filtered = filterAttempts(tab);
          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              {filtered.length === 0 ? (
                <EmptyTabState />
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {filtered.map((attempt) => (
                    <AttemptCard key={attempt.id} attempt={attempt} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ── Score Trend Chart ─────────────────────────────────── */}
      <ScoreTrendChart attempts={attempts} />
    </div>
  );
}
