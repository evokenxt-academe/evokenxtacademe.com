"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Point = {
  dayLabel: string;
  hours: number;
  breakdown?: Array<{ courseTitle: string; hours: number }>;
};

export function WatchHoursChart({ data }: { data: Point[] }) {
  return (
    <ChartContainer
      id="watch-hours-7d"
      className="min-h-[220px] w-full"
      config={{
        hours: { label: "Hours", color: "var(--chart-1)" },
      }}
    >
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="dayLabel"
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={30}
          tickFormatter={(v) => String(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="font-mono font-medium tabular-nums">
                    {typeof value === "number" ? value.toFixed(1) : String(value)}
                  </span>
                </div>
              )}
              labelFormatter={(label) => label}
            />
          }
        />
        <Bar
          dataKey="hours"
          fill="var(--color-hours)"
          radius={[8, 8, 2, 2]}
        />
      </BarChart>
    </ChartContainer>
  );
}

