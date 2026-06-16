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
      <AreaChart
        data={data}
        margin={{ left: 0, right: 8, top: 12, bottom: 0 }}
        aria-label="Watch hours over the last 7 days"
      >
        <defs>
          <linearGradient id="watchHoursGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-hours)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-hours)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} interval={0} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => Number(v).toFixed(1)}
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
          fill="url(#watchHoursGradient)"
          stroke="var(--color-hours)"
          strokeWidth={2}
          animationBegin={0}
          animationDuration={800}
        />
      </AreaChart>
    </ChartContainer>
  );
}
