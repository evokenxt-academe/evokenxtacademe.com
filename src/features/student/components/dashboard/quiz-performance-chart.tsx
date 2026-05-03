"use client";

import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconWriting,
} from "@tabler/icons-react";
import type { QuizScorePoint, QuizOverviewStats } from "@/features/student/types/dashboard";

interface QuizPerformanceChartProps {
  scores: QuizScorePoint[];
  overview: QuizOverviewStats;
}

const chartConfig = {
  scorePercent: { label: "Score", color: "var(--chart-2)" },
} satisfies ChartConfig;

function getTrendInfo(scores: QuizScorePoint[]) {
  if (scores.length < 2) return { direction: "neutral" as const, delta: 0 };
  const recent = scores.slice(-3);
  const older = scores.slice(0, Math.max(1, scores.length - 3));
  const recentAvg = recent.reduce((s, q) => s + q.scorePercent, 0) / recent.length;
  const olderAvg = older.reduce((s, q) => s + q.scorePercent, 0) / older.length;
  const delta = Math.round(recentAvg - olderAvg);
  return {
    direction: delta > 2 ? ("up" as const) : delta < -2 ? ("down" as const) : ("neutral" as const),
    delta: Math.abs(delta),
  };
}

export function QuizPerformanceChart({ scores, overview }: QuizPerformanceChartProps) {
  const chartData = useMemo(
    () =>
      scores.map((s, i) => ({
        ...s,
        label: s.quizTitle.length > 12 ? s.quizTitle.slice(0, 12) + "…" : s.quizTitle,
        index: i,
      })),
    [scores],
  );

  const trend = useMemo(() => getTrendInfo(scores), [scores]);

  const avgScore = useMemo(() => {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((s, q) => s + q.scorePercent, 0) / scores.length);
  }, [scores]);

  const passRate = overview.attempted > 0 ? Math.round((overview.passed / overview.attempted) * 100) : 0;

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Quiz Performance</CardTitle>
          {scores.length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] font-medium"
            >
              {trend.direction === "up" && (
                <IconTrendingUp className="size-3 text-emerald-500" />
              )}
              {trend.direction === "down" && (
                <IconTrendingDown className="size-3 text-red-400" />
              )}
              {trend.direction === "neutral" && (
                <IconMinus className="size-3 text-muted-foreground" />
              )}
              {trend.direction === "up"
                ? `+${trend.delta}%`
                : trend.direction === "down"
                  ? `-${trend.delta}%`
                  : "Steady"}
            </Badge>
          )}
        </div>
        <CardDescription>
          {overview.attempted > 0
            ? `${overview.passed}/${overview.attempted} quizzes passed · ${avgScore}% avg`
            : "No quiz attempts yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            {
              value: overview.published,
              label: "Available",
              icon: <IconWriting className="size-3.5 text-muted-foreground" />,
            },
            {
              value: overview.attempted,
              label: "Attempted",
              icon: <IconWriting className="size-3.5 text-blue-400" />,
            },
            {
              value: overview.passed,
              label: "Passed",
              icon: overview.passed > 0
                ? <IconCircleCheckFilled className="size-3.5 text-emerald-500" />
                : <IconCircleXFilled className="size-3.5 text-muted-foreground/40" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-0.5 rounded-lg border bg-muted/30 p-2.5 transition-colors"
            >
              {s.icon}
              <div className="text-xl font-semibold tabular-nums">{s.value}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pass rate indicator */}
        {overview.attempted > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${passRate}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              {passRate}% pass rate
            </span>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" domain={[0, 100]} allowDecimals={false} />
              <ReferenceLine y={50} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Pass", position: "right", className: "text-[10px] fill-muted-foreground" }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="scorePercent" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.index}
                    fill={entry.passed ? "var(--color-scorePercent)" : "hsl(var(--muted-foreground) / 0.3)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <IconWriting className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No attempts yet</p>
            <p className="text-xs text-muted-foreground/60">
              Complete a quiz to track your performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuizPerformanceChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border p-2.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          ))}
        </div>
        <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
