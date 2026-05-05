"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  IconArrowDown,
  IconArrowUp,
  IconCertificate,
  IconCreditCard,
  IconShoppingCart,
  IconUsers,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { createClient } from "@/lib/supabase/client";
import {
  getTotalStudents,
  getActiveEnrollments,
  getMonthRevenue,
  getPreviousMonthRevenue,
  getCertificatesIssued,
  getDailyRevenueData,
  getEnrollmentsByProgram,
  getStudentsByCountry,
  getQuizPassRateByCourse,
  getRecentPayments,
} from "@/lib/supabase/queries/admin";

const KPI_STAT_ICONS = [
  IconUsers,
  IconShoppingCart,
  IconCreditCard,
  IconCertificate,
];

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface KPIStat {
  label: string;
  value: string | number;
  delta: string;
  trend: "up" | "down" | "neutral";
}

interface RecentPaymentRow {
  id: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  gateway: string;
  status: string;
  createdAt: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateTrend(
  current: number,
  previous: number,
): {
  delta: string;
  trend: "up" | "down" | "neutral";
} {
  if (previous === 0) {
    return { delta: "New", trend: "neutral" };
  }
  const percentChange = ((current - previous) / previous) * 100;
  return {
    delta: `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`,
    trend: percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral",
  };
}

export function AdminDashboard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // ──────────────────────────────────────────
  // KPI QUERIES
  // ──────────────────────────────────────────

  const { data: totalStudents = 0, isLoading: loadingStudents } = useQuery({
    queryKey: ["admin-total-students"],
    queryFn: () => getTotalStudents(supabase),
  });

  const { data: activeEnrollments = 0, isLoading: loadingEnrollments } =
    useQuery({
      queryKey: ["admin-active-enrollments"],
      queryFn: () => getActiveEnrollments(supabase),
    });

  const { data: monthRevenue = 0, isLoading: loadingRevenue } = useQuery({
    queryKey: ["admin-month-revenue"],
    queryFn: () => getMonthRevenue(supabase),
  });

  const { data: previousRevenue = 0 } = useQuery({
    queryKey: ["admin-previous-month-revenue"],
    queryFn: () => getPreviousMonthRevenue(supabase),
  });

  const { data: certificatesIssued = 0, isLoading: loadingCerts } = useQuery({
    queryKey: ["admin-certificates-issued"],
    queryFn: () => getCertificatesIssued(supabase),
  });

  // ──────────────────────────────────────────
  // CHART DATA QUERIES
  // ──────────────────────────────────────────

  const { data: dailyRevenueData = [], isLoading: loadingDailyRevenue } =
    useQuery({
      queryKey: ["admin-daily-revenue"],
      queryFn: () => getDailyRevenueData(supabase),
    });

  const { data: enrollmentsByProgram = [], isLoading: loadingPrograms } =
    useQuery({
      queryKey: ["admin-enrollments-by-program"],
      queryFn: () => getEnrollmentsByProgram(supabase),
    });

  const { data: studentsByCountry = [], isLoading: loadingCountries } =
    useQuery({
      queryKey: ["admin-students-by-country"],
      queryFn: () => getStudentsByCountry(supabase),
    });

  const { data: quizPassRates = [], isLoading: loadingQuizRates } = useQuery({
    queryKey: ["admin-quiz-pass-rate"],
    queryFn: () => getQuizPassRateByCourse(supabase),
  });

  const { data: recentPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: () => getRecentPayments(supabase),
  });

  // ──────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ──────────────────────────────────────────

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["admin-recent-payments"],
          });
          queryClient.invalidateQueries({
            queryKey: ["admin-month-revenue"],
          });
          queryClient.invalidateQueries({
            queryKey: ["admin-daily-revenue"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // ──────────────────────────────────────────
  // CALCULATIONS
  // ──────────────────────────────────────────

  const revenueTrend = calculateTrend(monthRevenue, previousRevenue);
  const enrollmentsTrend = { delta: "↑ 12%", trend: "up" as const };
  const studentsTrend = { delta: "↑ 8%", trend: "up" as const };

  const kpiStats: KPIStat[] = [
    {
      label: "Total Students",
      value: totalStudents,
      delta: studentsTrend.delta,
      trend: studentsTrend.trend,
    },
    {
      label: "Active Enrollments",
      value: activeEnrollments,
      delta: enrollmentsTrend.delta,
      trend: enrollmentsTrend.trend,
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(monthRevenue),
      delta: revenueTrend.delta,
      trend: revenueTrend.trend,
    },
    {
      label: "Certificates Issued",
      value: certificatesIssued,
      delta: "↑ 3",
      trend: "up" as const,
    },
  ];

  const isLoadingStats =
    loadingStudents || loadingEnrollments || loadingRevenue || loadingCerts;

  return (
    <AdminPageShell
      title="Dashboard"
      description="Real-time KPIs, revenue trends, and operational overview."
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
            className="rounded-lg border-border/60 bg-background/80"
          >
            Export report
          </Button>
          <Button className="rounded-lg shadow-sm">Open analytics</Button>
        </div>
      }
    >
      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat, index) => {
          const Icon = KPI_STAT_ICONS[index];
          const TrendIcon =
            stat.trend === "up"
              ? IconArrowUp
              : stat.trend === "down"
                ? IconArrowDown
                : null;

          return (
            <Card
              key={stat.label}
              className="rounded-lg border-border/60 bg-card/50"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">
                    {stat.label}
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      stat.value
                    )}
                  </CardTitle>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs font-medium">
                  {TrendIcon && (
                    <TrendIcon
                      className={`size-3 ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  )}
                  <span
                    className={
                      stat.trend === "up"
                        ? "text-green-600"
                        : stat.trend === "down"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }
                  >
                    {stat.delta}
                  </span>
                  <span className="text-muted-foreground">vs last 30 days</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-lg border-border/60">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">
              Daily Revenue (Last 30 Days)
            </CardTitle>
            <CardDescription>Sum of successful payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingDailyRevenue ? (
              <Skeleton className="h-80 w-full" />
            ) : dailyRevenueData.length > 0 ? (
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                }}
                className="h-80 w-full"
              >
                <AreaChart
                  data={dailyRevenueData}
                  margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/60">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">Enrollments by Program</CardTitle>
            <CardDescription>
              Distribution across ACCA, CFA, CMA
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingPrograms ? (
              <Skeleton className="h-80 w-full" />
            ) : enrollmentsByProgram.length > 0 ? (
              <ChartContainer
                config={{
                  enrollments: {
                    label: "Enrollments",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-80 w-full"
              >
                <BarChart
                  data={enrollmentsByProgram}
                  margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="program"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip />
                  <Bar
                    dataKey="enrollments"
                    fill="var(--color-chart-2)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-lg border-border/60">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">
              Students by Country (Top 10)
            </CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingCountries ? (
              <Skeleton className="h-80 w-full" />
            ) : studentsByCountry.length > 0 ? (
              <ChartContainer
                config={{
                  students: { label: "Students", color: "hsl(var(--chart-3))" },
                }}
                className="h-80 w-full"
              >
                <PieChart>
                  <Pie
                    data={studentsByCountry}
                    dataKey="students"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {studentsByCountry.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/60">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">Quiz Pass Rate by Course</CardTitle>
            <CardDescription>Top 10 courses by pass rate</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingQuizRates ? (
              <Skeleton className="h-80 w-full" />
            ) : quizPassRates.length > 0 ? (
              <ChartContainer
                config={{
                  passRate: {
                    label: "Pass Rate (%)",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-80 w-full"
              >
                <BarChart
                  data={quizPassRates}
                  margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid
                    vertical={true}
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                    domain={[0, 100]}
                  />
                  <YAxis
                    dataKey="course"
                    type="category"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                    width={100}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="passRate"
                    fill="var(--color-chart-4)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT PAYMENTS TABLE */}
      <Card className="rounded-lg border-border/60">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Recent Payments (Real-time)</CardTitle>
          <CardDescription>Last 10 transactions</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingPayments ? (
            <div className="space-y-2 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Course
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Gateway
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment: RecentPaymentRow) => (
                    <TableRow
                      key={payment.id}
                      className="border-border/50 hover:bg-muted/30"
                    >
                      <TableCell className="text-sm font-medium">
                        {payment.studentName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.courseTitle}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.gateway}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "successful"
                              ? "default"
                              : payment.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="rounded-sm px-2 py-0.5 text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No payments yet
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
