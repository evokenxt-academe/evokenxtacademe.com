"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type QuizPoint = {
  quiz_title: string;
  percentage: number;
  passed: boolean;
};

const chartConfig = {
  percentage: { label: "Score %", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function QuizPerformanceChart({ data }: { data: QuizPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No quiz attempts yet.
      </div>
    );
  }

  return (
    <ChartContainer
      id="quiz-performance"
      className="min-h-[240px] w-full"
      config={chartConfig}
    >
      <BarChart
        data={data}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="quiz_title"
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) =>
            String(val).length > 12 ? `${String(val).slice(0, 12)}…` : String(val)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <ReferenceLine
          y={50}
          stroke="var(--border)"
          strokeDasharray="4 4"
          label={{ value: "Pass", fill: "var(--muted-foreground)", fontSize: 10, position: "insideTopRight" }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-mono font-medium tabular-nums">
                    {typeof value === "number" ? `${value}%` : String(value)}
                  </span>
                </div>
              )}
              labelFormatter={(label) => String(label)}
            />
          }
        />
        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.passed ? "var(--chart-1)" : "var(--chart-5)"}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
