"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconArrowRight,
  IconBook,
  IconCash,
  IconUsers,
  IconUserPlus,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { adminApi } from "@/features/admin/lib/admin-api";
import {
  dashboardStats,
  growthSeries,
  recentActivity,
  revenueSeries,
} from "@/features/admin/data/admin-sample-data";

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} as const;

const userChartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--chart-4))",
  },
} as const;

const statIcons = [IconUsers, IconBook, IconCash, IconUserPlus];

const zeroStats = [
  { label: "Courses", value: "0", delta: "0" },
  { label: "Users", value: "0", delta: "0" },
  { label: "Revenue", value: "0", delta: "0" },
  { label: "Enrollments", value: "0", delta: "0" },
];

const zeroSnapshot = [
  { label: "Pending payments", value: "0", note: "No items awaiting review" },
  { label: "Live streams today", value: "0", note: "Nothing scheduled" },
  { label: "Quiz submissions", value: "0", note: "No submissions yet" },
  { label: "Certificates issued", value: "0", note: "Awaiting first issuance" },
];

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
  });

  const stats = data?.stats ?? dashboardStats;
  const revenueData = data?.revenueSeries ?? revenueSeries;
  const growthData = data?.growthSeries ?? growthSeries;
  const activity = data?.recentActivity ?? recentActivity;
  const snapshot = data?.operationsSnapshot ?? zeroSnapshot;
  const displayStats = stats.map((stat, index) => ({
    ...stat,
    label: zeroStats[index]?.label ?? stat.label,
    value: zeroStats[index]?.value ?? "0",
    delta: zeroStats[index]?.delta ?? "0",
  }));

  return (
    <AdminPageShell
      title="Dashboard"
      description="Minimal system overview for operations, revenue, and engagement."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Badge
            variant="secondary"
            className="w-fit rounded-full px-3 py-1 text-xs font-medium"
          >
            Live sync enabled
          </Badge>
          <Button
            variant="outline"
            className="rounded-xl border-border/60 bg-background/80"
          >
            Export report
          </Button>
          <Button className="rounded-xl shadow-sm">
            Open analytics
            <IconArrowRight className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(isLoading && !data ? zeroStats : displayStats).map((stat, index) => {
          const Icon = statIcons[index];

          return (
            <Card
              key={stat.label}
              className="rounded-2xl border-border/60 bg-card/95 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                {isLoading && !data ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <CardDescription className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {stat.label}
                    </CardDescription>
                    <CardTitle className="mt-1 text-3xl tracking-tight">
                      {stat.value}
                    </CardTitle>
                  </div>
                )}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && !data ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {stat.delta} vs previous period
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 border-b border-border/50 pb-4">
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>
              Monthly collections across courses, subscriptions, and live
              batches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : (
              <ChartContainer
                config={revenueChartConfig}
                className="h-80 w-full"
              >
                <AreaChart
                  data={revenueData}
                  margin={{ left: 6, right: 6, top: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={44} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="var(--color-revenue)"
                    fillOpacity={0.16}
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 border-b border-border/50 pb-4">
            <CardTitle>User growth</CardTitle>
            <CardDescription>
              New signups and returning users over the last six months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : (
              <ChartContainer config={userChartConfig} className="h-80 w-full">
                <LineChart
                  data={growthData}
                  margin={{ left: 6, right: 6, top: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={52} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 border-b border-border/50 pb-4">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Operational signals that need an admin’s attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div
                  className={`mt-0.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}
                >
                  {item.title}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 border-b border-border/50 pb-4">
            <CardTitle>Operations snapshot</CardTitle>
            <CardDescription>Fast context for the next action.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            {snapshot.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/60 bg-background/60 p-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
