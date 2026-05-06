"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
import { useTestAnalytics } from "@/features/tests/hooks";
import { useStudentQuizzes } from "@/features/tests/hooks";
import type { StudentAttemptAnalytics } from "@/features/tests/types";
import { QuizCard } from "@/features/tests/components/quiz-card";

// ── Helpers ──────────────────────────────────────────────────────

function getScorePercent(a: StudentAttemptAnalytics) {
  if (a.totalMarks === 0) return 0;
  return Math.round((a.score / a.totalMarks) * 100);
}

function isPassed(a: StudentAttemptAnalytics) {
  return a.status === "submitted" && a.score >= a.passingMarks;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(a: StudentAttemptAnalytics) {
  if (a.status === "in_progress") return "In Progress";
  if (a.status === "timed_out") return "Timed Out";
  return isPassed(a) ? "Passed" : "Failed";
}

function getStatusClasses(a: StudentAttemptAnalytics) {
  if (a.status === "in_progress")
    return "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400";
  if (a.status === "timed_out")
    return "border-border text-muted-foreground bg-muted";
  if (isPassed(a))
    return "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400";
  return "border-red-500/40 text-red-600 bg-red-500/10 dark:text-red-400";
}

function getTypeBadgeClasses(type: string | undefined) {
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
  scorePercent: {
    label: "Score %",
    color: "oklch(0.723 0.148 155.995)",
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

function AttemptCard({ attempt }: { attempt: StudentAttemptAnalytics }) {
  const percent = getScorePercent(attempt);
  const passed = isPassed(attempt);
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
                  {attempt.quizTitle}
                </h3>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] capitalize ${getTypeBadgeClasses(attempt.quizType)}`}
                >
                  {attempt.quizType}
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
                  / {attempt.totalMarks}
                </span>
              </span>
              {isSubmitted && (
                <span
                  className={`text-xs font-medium ${passed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {percent}%
                </span>
              )}
            </div>
            <Progress
              value={isSubmitted ? percent : 0}
              className={`h-1.5 bg-muted ${isSubmitted
                  ? passed
                    ? "*:data-[slot=progress-indicator]:bg-emerald-500"
                    : "*:data-[slot=progress-indicator]:bg-red-500"
                  : "*:data-[slot=progress-indicator]:bg-muted-foreground/30"
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
                {formatDate(attempt.submittedAt ?? attempt.startedAt)}
              </span>
            </div>

            {isSubmitted && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Link href={`/dashboard/tests/result/${attempt.id}`}>
                  <Eye className="size-3" />
                  Review Answers
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Score Trend Chart ────────────────────────────────────────────

function ScoreTrendChart({ attempts }: { attempts: StudentAttemptAnalytics[] }) {
  const chartData = useMemo(() => {
    const submitted = attempts
      .filter((a) => a.status === "submitted")
      .sort(
        (a, b) =>
          new Date(a.submittedAt!).getTime() -
          new Date(b.submittedAt!).getTime()
      )
      .slice(-7);

    return submitted.map((a, i) => ({
      attempt: i + 1,
      scorePercent: getScorePercent(a),
      quiz: a.quizTitle,
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
            — Last 7 attempts
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
                  stopColor="var(--color-scorePercent)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-scorePercent)"
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
              tickFormatter={(v) => `#${v}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine
              y={60}
              strokeDasharray="6 4"
              strokeWidth={1}
              className="stroke-muted-foreground/40"
              label={{
                value: "Pass 60%",
                position: "insideTopRight",
                fontSize: 10,
                className: "fill-muted-foreground",
              }}
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
              dataKey="scorePercent"
              stroke="var(--color-scorePercent)"
              strokeWidth={2}
              fill="url(#greenFill)"
              dot={{
                r: 3.5,
                fill: "var(--color-scorePercent)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "var(--background)",
                fill: "var(--color-scorePercent)",
              }}
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

// ── Main Component ───────────────────────────────────────────────

export function TestDashboardPage() {
  const { data: analytics, isLoading } = useTestAnalytics();
  const quizzesQuery = useStudentQuizzes();

  // ── Compute stats from real data ───────────────────────────────
  const stats = useMemo(() => {
    if (!analytics) return { totalAttempts: 0, avgScore: 0, testsPassed: 0 };
    
    const attempts = analytics.attempts || [];
    const submitted = attempts.filter((a) => a.status === "submitted");
    const totalAttempts = attempts.length;

    const avgScore =
      submitted.length > 0
        ? Math.round(
          submitted.reduce((sum, a) => sum + getScorePercent(a), 0) /
          submitted.length
        )
        : 0;

    const testsPassed = submitted.filter((a) => isPassed(a)).length;

    return { totalAttempts, avgScore, testsPassed };
  }, [analytics]);

  // ── Filter by quiz type ────────────────────────────────────────
  const filterAttempts = (type: string) => {
    if (!analytics) return [];
    const attempts = analytics.attempts || [];
    if (type === "all") return attempts;
    return attempts.filter((a) => a.quizType === type);
  };

  const filterQuizzes = (type: string) => {
    const quizzes = quizzesQuery.data?.quizzes ?? [];
    if (type === "all") return quizzes;
    return quizzes.filter((q) => q.quizType === type);
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center p-16">
        <div className="text-sm text-muted-foreground">Loading tests dashboard...</div>
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
          value={String(stats.testsPassed)}
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
          const available = filterQuizzes(tab);
          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Available tests</p>
                      <p className="text-xs text-muted-foreground">
                        Start a quiz from your enrolled courses.
                      </p>
                    </div>
                  </div>
                  {available.length === 0 ? (
                    <EmptyTabState />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-1">
                      {available.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Recent attempts</p>
                    <p className="text-xs text-muted-foreground">
                      Your submitted and timed out attempts.
                    </p>
                  </div>
                  {filtered.length === 0 ? (
                    <EmptyTabState />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-1">
                      {filtered.map((attempt) => (
                        <AttemptCard key={attempt.id} attempt={attempt} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ── Score Trend Chart ─────────────────────────────────── */}
      <ScoreTrendChart attempts={analytics?.attempts || []} />
    </div>
  );
}
