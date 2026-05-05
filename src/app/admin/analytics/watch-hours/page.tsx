"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDataTable } from "@/features/admin/components/admin-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  getWatchHoursByDateRange,
  getTopStudentsByWatchHours,
  getAnalyticsMetrics,
  type WatchHourRow,
  type StudentWatchRow,
} from "@/lib/supabase/queries/analytics";
import { Clock, Users, TrendingUp, Bookmark } from "lucide-react";

const CHART_COLORS = {
  acca: "hsl(var(--chart-1))",
  cfa: "hsl(var(--chart-2))",
  cma: "hsl(var(--chart-3))",
};

function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

export default function WatchHoursPage() {
  const supabase = createClient();
  const [dateRange, setDateRange] = React.useState("30");
  const [course, setCourse] = React.useState("all");

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const days = parseInt(dateRange);
  const dateTo = new Date();
  const dateFrom = subDays(dateTo, days);

  const { data: watchData = [], isLoading: watchLoading } = useQuery({
    queryKey: ["watch-hours", dateRange],
    queryFn: () =>
      getWatchHoursByDateRange(
        supabase,
        dateFrom.toISOString(),
        dateTo.toISOString(),
      ),
  });

  const { data: topStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["top-students", dateRange],
    queryFn: () =>
      getTopStudentsByWatchHours(
        supabase,
        20,
        dateFrom.toISOString(),
        dateTo.toISOString(),
      ),
  });

  const { data: metrics } = useQuery({
    queryKey: ["analytics-metrics", dateRange],
    queryFn: () =>
      getAnalyticsMetrics(
        supabase,
        dateFrom.toISOString(),
        dateTo.toISOString(),
      ),
  });

  // ──────────────────────────────────────────
  // TABLE COLUMNS
  // ──────────────────────────────────────────

  const columns: ColumnDef<StudentWatchRow>[] = [
    {
      accessorKey: "rank",
      header: "#",
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.getValue("rank")}</span>
      ),
    },
    {
      accessorKey: "student_name",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">
            {row.getValue("student_name")}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.student_email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "course_title",
      header: "Course",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("course_title")}
        </span>
      ),
    },
    {
      accessorKey: "total_hours",
      header: "Hours",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatHours(row.getValue("total_hours"))}
        </span>
      ),
    },
    {
      accessorKey: "last_active",
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.getValue("last_active")}
        </span>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Watch Hours Analytics"
      description="Track student engagement and learning activity"
    >
      {/* Date & Course Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="size-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {metrics ? formatHours(metrics.total_watch_hours) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="size-4" />
              Avg per Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {metrics ? formatHours(metrics.avg_watch_hours_per_student) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              Most Active Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold truncate">
              {metrics?.most_active_day || "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bookmark className="size-4" />
              Most Watched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">
              {metrics?.most_watched_course || "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Watch Hours Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Watch Hours</CardTitle>
          <CardDescription>Stacked by program</CardDescription>
        </CardHeader>
        <CardContent>
          {watchLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : watchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={watchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${(value as number).toFixed(1)}h`,
                    "",
                  ]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-IN")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="acca_hours"
                  stackId="1"
                  stroke={CHART_COLORS.acca}
                  fill={CHART_COLORS.acca}
                  name="ACCA"
                />
                <Area
                  type="monotone"
                  dataKey="cfa_hours"
                  stackId="1"
                  stroke={CHART_COLORS.cfa}
                  fill={CHART_COLORS.cfa}
                  name="CFA"
                />
                <Area
                  type="monotone"
                  dataKey="cma_hours"
                  stackId="1"
                  stroke={CHART_COLORS.cma}
                  fill={CHART_COLORS.cma}
                  name="CMA"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top Students by Watch Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            columns={columns}
            data={topStudents}
            isLoading={studentsLoading}
            searchPlaceholder="Search students..."
          />
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
