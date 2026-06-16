"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarRadiusAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type CourseProgressEntry = {
  title: string;
  completed: number;
  remaining: number;
  pct: number;
};

const chartConfig = {
  progress: { label: "Progress", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function CourseProgressChart({
  data,
  overallPct,
}: {
  data: CourseProgressEntry[];
  overallPct?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        No enrolled courses.
      </div>
    );
  }

  const totalCompleted = data.reduce((s, d) => s + d.completed, 0);
  const totalRemaining = data.reduce((s, d) => s + d.remaining, 0);
  const total = totalCompleted + totalRemaining;
  const pct = overallPct ?? (total > 0 ? Math.round((totalCompleted / total) * 100) : 0);

  const chartData = [{ name: "progress", value: pct, fill: "var(--color-progress)" }];

  return (
    <ChartContainer
      id="course-progress"
      className="mx-auto aspect-square max-h-[220px] w-full"
      config={chartConfig}
    >
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={-270}
        innerRadius={70}
        outerRadius={100}
        aria-label={`Overall course progress ${pct} percent`}
      >
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{value}%</span>
              )}
            />
          }
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan x="50%" dy="-0.2em" className="fill-foreground text-3xl font-bold">
              {pct}%
            </tspan>
            <tspan x="50%" dy="1.4em" className="fill-muted-foreground text-xs">
              complete
            </tspan>
          </text>
        </PolarRadiusAxis>
        <RadialBar
          dataKey="value"
          background
          cornerRadius={8}
          animationBegin={0}
          animationDuration={800}
        />
      </RadialBarChart>
    </ChartContainer>
  );
}
