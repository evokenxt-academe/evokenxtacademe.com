"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Point = {
  dayLabel: string;
  hours: number;
};

type WatchHoursChartProps = {
  data: Point[];
  averageHours?: number;
};

export function WatchHoursChart({ data, averageHours }: WatchHoursChartProps) {
  return (
    <ChartContainer
      id="watch-hours-7d"
      className="min-h-[240px] w-full"
      config={{
        hours: { label: "Hours", color: "var(--chart-1)" },
      }}
    >
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
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
        {typeof averageHours === "number" ? (
          <ReferenceLine y={averageHours} stroke="var(--border)" strokeDasharray="4 4" />
        ) : null}
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
        <Area
          type="monotone"
          dataKey="hours"
          fill="var(--color-hours)"
          fillOpacity={0.24}
          stroke="var(--color-hours)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

