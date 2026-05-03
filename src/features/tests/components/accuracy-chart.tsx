"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { StudentAttemptAnalytics } from "@/features/tests/types";

interface AccuracyChartProps {
  attempts: StudentAttemptAnalytics[];
}

const chartConfig = {
  correct: {
    label: "Correct",
    color: "oklch(0.723 0.148 155.995)",
  },
  incorrect: {
    label: "Incorrect",
    color: "oklch(0.577 0.245 27.325)",
  },
} satisfies ChartConfig;

export function AccuracyChart({ attempts }: AccuracyChartProps) {
  const chartData = useMemo(() => {
    if (!attempts.length) return [];

    let totalCorrect = 0;
    let totalQuestions = 0;

    for (const a of attempts) {
      if (a.totalMarks > 0) {
        const correctRatio = a.score / a.totalMarks;
        totalCorrect += correctRatio;
        totalQuestions += 1;
      }
    }

    if (totalQuestions === 0) return [];

    const avgCorrectPct = Math.round((totalCorrect / totalQuestions) * 100);
    const avgIncorrectPct = 100 - avgCorrectPct;

    return [
      { label: "Correct", value: avgCorrectPct, fill: "correct" },
      { label: "Incorrect", value: avgIncorrectPct, fill: "incorrect" },
    ];
  }, [attempts]);

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl border-border/50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Accuracy</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Complete a test to see your accuracy breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Accuracy</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 32, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              className="stroke-border/40"
            />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              width={70}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value}%`}
                />
              }
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.fill === "correct"
                      ? "var(--color-correct)"
                      : "var(--color-incorrect)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Summary stats below chart */}
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-sm bg-[oklch(0.723_0.148_155.995)]" />
            <span className="text-muted-foreground">
              Correct:{" "}
              <span className="font-medium text-foreground">
                {chartData[0]?.value ?? 0}%
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-sm bg-[oklch(0.577_0.245_27.325)]" />
            <span className="text-muted-foreground">
              Incorrect:{" "}
              <span className="font-medium text-foreground">
                {chartData[1]?.value ?? 0}%
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
