"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeeklyActivityPoint } from "@/features/student/types/dashboard";

interface WeeklyActivityChartProps {
  data: WeeklyActivityPoint[];
}

const chartConfig = {
  minutes: {
    label: "Minutes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Weekly Activity
        </CardTitle>
        <CardDescription>
          {totalMinutes > 0
            ? `${totalMinutes} minutes watched this week`
            : "No activity recorded this week"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="fillMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-minutes)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-minutes)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/40"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="var(--color-minutes)"
              strokeWidth={2}
              fill="url(#fillMinutes)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function WeeklyActivityChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[220px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
