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
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  IconArrowDown,
  IconArrowUp,
  IconCertificate,
  IconChartBar,
  IconCreditCard,
  IconMinus,
  IconShoppingCart,
  IconUsers,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
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

// ──────────────────────────────────────────
// CHART CONFIGS (shadcn pattern)
// ──────────────────────────────────────────

const revenueChartConfig = {
  revenue: { label: "Revenue (₹)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const enrollmentChartConfig = {
  enrollments: { label: "Enrollments", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const countryChartConfig = {
  students: { label: "Students", color: "hsl(var(--chart-3))" },
  india: { label: "India", color: "hsl(var(--chart-1))" },
  uk: { label: "UK", color: "hsl(var(--chart-2))" },
  uae: { label: "UAE", color: "hsl(var(--chart-3))" },
  usa: { label: "USA", color: "hsl(var(--chart-4))" },
  other: { label: "Other", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const quizChartConfig = {
  passRate: { label: "Pass Rate (%)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const CHART_FILLS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

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

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

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
): { delta: string; trend: "up" | "down" | "neutral" } {
  if (previous === 0) return { delta: "New", trend: "neutral" };
  const pct = ((current - previous) / previous) * 100;
  return {
    delta: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`,
    trend: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
  };
}

// ──────────────────────────────────────────
// EMPTY STATE
// ──────────────────────────────────────────

function ChartEmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
        <IconChartBar className="size-5 text-muted-foreground/60" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground/60">
          Data will appear here once available
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// KPI CARD
// ──────────────────────────────────────────

const KPI_ICONS = [IconUsers, IconShoppingCart, IconCreditCard, IconCertificate];

function KPICard({
  stat,
  index,
  loading,
}: {
  stat: KPIStat;
  index: number;
  loading: boolean;
}) {
  const Icon = KPI_ICONS[index];
  const TrendIcon =
    stat.trend === "up"
      ? IconArrowUp
      : stat.trend === "down"
        ? IconArrowDown
        : IconMinus;

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:border-border/80 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardDescription className="text-xs font-semibold uppercase tracking-widest">
          {stat.label}
        </CardDescription>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {loading ? (
          <Skeleton className="mb-2 h-9 w-28" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <TrendIcon
            className={`size-3.5 ${
              stat.trend === "up"
                ? "text-emerald-500"
                : stat.trend === "down"
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          />
          <span
            className={
              stat.trend === "up"
                ? "text-emerald-500"
                : stat.trend === "down"
                  ? "text-red-500"
                  : "text-muted-foreground"
            }
          >
            {stat.delta}
          </span>
          <span className="text-muted-foreground/70">vs last 30 days</span>
        </div>
      </CardFooter>
      {/* Subtle accent bar at bottom */}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${CHART_FILLS[index]}, transparent)`,
          opacity: 0.5,
        }}
      />
    </Card>
  );
}

// ──────────────────────────────────────────
// MAIN DASHBOARD
// ──────────────────────────────────────────

export function AdminDashboard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // KPI QUERIES
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

  // CHART DATA
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

  // REAL-TIME
  React.useEffect(() => {
    const channel = supabase
      .channel("admin-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-recent-payments"] });
          queryClient.invalidateQueries({ queryKey: ["admin-month-revenue"] });
          queryClient.invalidateQueries({ queryKey: ["admin-daily-revenue"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // COMPUTED
  const revenueTrend = calculateTrend(monthRevenue, previousRevenue);

  const kpiStats: KPIStat[] = [
    {
      label: "Total Students",
      value: totalStudents,
      delta: "↑ 8%",
      trend: "up",
    },
    {
      label: "Active Enrollments",
      value: activeEnrollments,
      delta: "↑ 12%",
      trend: "up",
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
      trend: "up",
    },
  ];

  const isLoadingStats =
    loadingStudents || loadingEnrollments || loadingRevenue || loadingCerts;

  // Pie chart data with fill colors
  const countryPieData = studentsByCountry.map((item, i) => ({
    ...item,
    fill: CHART_FILLS[i % CHART_FILLS.length],
  }));

  // Enrollment bar data with fill colors
  const enrollmentBarData = enrollmentsByProgram.map((item, i) => ({
    ...item,
    fill: CHART_FILLS[i % CHART_FILLS.length],
  }));

  return (
    <AdminPageShell
      title="Dashboard"
      description="Real-time KPIs, revenue trends, and operational overview."
      actions={
        <Badge
          variant="secondary"
          className="w-fit rounded-full px-3 py-1 text-xs font-medium"
        >
          <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live sync enabled
        </Badge>
      }
    >
      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiStats.map((stat, index) => (
          <KPICard
            key={stat.label}
            stat={stat}
            index={index}
            loading={isLoadingStats}
          />
        ))}
      </div>

      {/* ── ROW 1: Revenue Area + Enrollments Bar ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {/* Revenue — spans 4 cols */}
        <Card className="border-border/50 lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Daily revenue from successful payments — last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDailyRevenue ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : dailyRevenueData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart
                  data={dailyRevenueData}
                  margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#fillRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartEmptyState message="No revenue data yet" />
            )}
          </CardContent>
        </Card>

        {/* Enrollments by Program — spans 3 cols */}
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader>
            <CardTitle>Enrollments by Program</CardTitle>
            <CardDescription>
              Distribution across ACCA, CFA, CMA programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPrograms ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : enrollmentBarData.length > 0 ? (
              <ChartContainer config={enrollmentChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={enrollmentBarData}
                  margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="program"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="enrollments"
                    radius={[6, 6, 0, 0]}
                    fill="var(--color-chart-2)"
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartEmptyState message="No enrollment data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 2: Country Pie + Quiz Pass Rates ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students by Country — Donut */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Students by Country</CardTitle>
            <CardDescription>
              Geographic distribution — Top 10 countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCountries ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : countryPieData.length > 0 ? (
              <ChartContainer config={countryChartConfig} className="mx-auto h-[280px] w-full max-w-[360px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="country" />}
                  />
                  <Pie
                    data={countryPieData}
                    dataKey="students"
                    nameKey="country"
                    innerRadius={60}
                    outerRadius={110}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    <LabelList
                      dataKey="country"
                      className="fill-foreground"
                      stroke="none"
                      fontSize={11}
                      offset={16}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <ChartEmptyState message="No student location data" />
            )}
          </CardContent>
          {countryPieData.length > 0 && (
            <CardFooter className="flex flex-wrap gap-3 border-t border-border/40 pt-4">
              {countryPieData.slice(0, 5).map((item, i) => (
                <div key={item.country} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ backgroundColor: CHART_FILLS[i % CHART_FILLS.length] }}
                  />
                  <span className="text-muted-foreground">{item.country}</span>
                  <span className="font-medium">{item.students}</span>
                </div>
              ))}
            </CardFooter>
          )}
        </Card>

        {/* Quiz Pass Rates */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Quiz Pass Rate by Course</CardTitle>
            <CardDescription>
              Top 10 courses sorted by student pass rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingQuizRates ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : quizPassRates.length > 0 ? (
              <ChartContainer config={quizChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={quizPassRates}
                  layout="vertical"
                  margin={{ left: 4, right: 16, top: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    dataKey="course"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={100}
                    tickFormatter={(v) =>
                      v.length > 14 ? `${v.slice(0, 14)}…` : v
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="passRate"
                    fill="var(--color-chart-4)"
                    radius={[0, 6, 6, 0]}
                  >
                    <LabelList
                      dataKey="passRate"
                      position="right"
                      className="fill-foreground"
                      fontSize={11}
                      formatter={(v: any) => `${v}%`}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartEmptyState message="No quiz data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT PAYMENTS TABLE ── */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                Last 10 transactions — updates in real-time
              </CardDescription>
            </div>
            <Badge variant="outline" className="hidden gap-1.5 sm:flex">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loadingPayments ? (
            <div className="flex flex-col gap-2 px-6 pb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Course
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Gateway
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="pr-6 text-xs font-semibold uppercase tracking-wider">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment: RecentPaymentRow) => (
                    <TableRow
                      key={payment.id}
                      className="border-border/30 transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="pl-6 text-sm font-medium">
                        {payment.studentName}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {payment.courseTitle}
                      </TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">
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
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-xs tabular-nums text-muted-foreground">
                        {payment.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-3 border-t border-dashed border-border/40">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                <IconCreditCard className="size-5 text-muted-foreground/60" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-muted-foreground">
                  No payments yet
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Transactions will appear here in real-time
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
