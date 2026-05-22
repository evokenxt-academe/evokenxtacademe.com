"use client";

import {
  PieChart,
  Pie,
  Cell,
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
  completed: { label: "Completed", color: "var(--chart-1)" },
  remaining: { label: "Remaining", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function CourseProgressChart({ data }: { data: CourseProgressEntry[] }) {
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
  const overallPct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  const pieData = [
    { name: "Completed", value: totalCompleted },
    { name: "Remaining", value: totalRemaining },
  ];

  const COLORS = ["var(--chart-1)", "var(--muted)"];

  return (
    <ChartContainer
      id="course-progress"
      className="min-h-[200px] w-full"
      config={chartConfig}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{String(name)}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {typeof value === "number" ? value : String(value)} lectures
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {pieData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index]}
              stroke="none"
            />
          ))}
        </Pie>
        {/* Center label */}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-2xl font-bold"
        >
          {overallPct}%
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-xs"
        >
          complete
        </text>
      </PieChart>
    </ChartContainer>
  );
}
