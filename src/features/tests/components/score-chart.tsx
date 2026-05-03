"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { StudentAttemptAnalytics } from "@/features/tests/types";

interface ScoreChartProps {
  attempts: StudentAttemptAnalytics[];
}

const chartConfig = {
  score: {
    label: "Score %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ScoreChart({ attempts }: ScoreChartProps) {
  const chartData = useMemo(() => {
    if (!attempts.length) return [];

    return attempts
      .filter((a) => a.submittedAt)
      .map((a) => ({
        date: formatDate(a.submittedAt),
        score: a.percentage,
        quiz: a.quizTitle,
      }));
  }, [attempts]);

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl border-border/50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Score Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No attempt data yet. Complete a test to see your score trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Score Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-score)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-score)"
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
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
              stroke="var(--color-score)"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ r: 3, fill: "var(--color-score)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
