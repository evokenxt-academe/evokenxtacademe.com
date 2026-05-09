"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  useQuizTypeDistribution,
  useDailyQuizAttempts,
} from "@/hooks/useQuizzes";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

// Light theme colors (more subtle and professional)
const COLORS_LIGHT = {
  practice: "#3B82F6", // Blue
  graded: "#8B5CF6", // Purple
  mock_exam: "#F59E0B", // Amber
  final_exam: "#EF4444", // Red
};

// Dark theme colors (more vibrant for visibility)
const COLORS_DARK = {
  practice: "#60A5FA", // Bright Blue
  graded: "#A78BFA", // Bright Purple
  mock_exam: "#FBBF24", // Bright Amber
  final_exam: "#F87171", // Bright Red
};

export function QuizAnalyticsRow() {
  const { theme } = useTheme();
  const { data: typeData, isLoading: typeLoading } = useQuizTypeDistribution();
  const { data: dailyData, isLoading: dailyLoading } = useDailyQuizAttempts();

  // Select colors based on theme
  const COLORS = theme === "dark" ? COLORS_DARK : COLORS_LIGHT;

  // Calculate total attempts from daily data
  const totalAttempts =
    dailyData?.reduce((sum, day) => sum + (day.attempts || 0), 0) || 0;
  const averageAttempts =
    dailyData && dailyData.length > 0
      ? Math.round((totalAttempts / dailyData.length) * 10) / 10
      : 0;
  const peakAttempts =
    dailyData?.reduce((max, day) => Math.max(max, day.attempts || 0), 0) || 0;

  // Calculate trend (compare last 7 days with previous 7 days)
  const last7Days = dailyData?.slice(-7) || [];
  const prev7Days = dailyData?.slice(-14, -7) || [];
  const last7Total =
    last7Days.reduce((sum, day) => sum + (day.attempts || 0), 0) || 0;
  const prev7Total =
    prev7Days.reduce((sum, day) => sum + (day.attempts || 0), 0) || 0;
  const trendIncrease = last7Total - prev7Total;
  const trendPercent =
    prev7Total > 0 ? Math.round((trendIncrease / prev7Total) * 100) : 0;

  // Get last 14 days for chart display
  const last14Days = dailyData?.slice(-14) || [];

  const lineColor = theme === "dark" ? "#60A5FA" : "#3B82F6";
  const gridColor =
    theme === "dark" ? "rgba(75, 85, 99, 0.2)" : "rgba(209, 213, 219, 0.5)";
  const textColor = theme === "dark" ? "#9CA3AF" : "#6B7280";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Quiz Type Distribution - Pie Chart */}
      <Card className="rounded-xl border bg-gradient-to-br from-card via-card to-card/80 shadow-sm dark:shadow-lg overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="space-y-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Quiz Type Distribution
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              {typeData?.reduce((sum, item) => sum + item.value, 0) || 0} Total
              Quizzes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-[310px] p-0 pt-8 pb-6 px-6">
          {typeLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : typeData && typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={1.5}
                  startAngle={90}
                  endAngle={450}
                >
                  {typeData.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={COLORS[entry.name] || COLORS_LIGHT.practice}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    `${value} quiz${value !== 1 ? "zes" : ""}`
                  }
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${theme === "dark" ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    boxShadow:
                      theme === "dark"
                        ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                        : "0 4px 12px rgba(0, 0, 0, 0.1)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{
                    color: theme === "dark" ? "#E5E7EB" : "#1F2937",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "16px" }}
                  formatter={(value: any) => (
                    <span className="text-xs font-medium capitalize">
                      {value}
                    </span>
                  )}
                  iconType="square"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No quiz data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Quiz Attempts - Line Chart */}
      <Card className="rounded-xl border bg-gradient-to-br from-card via-card to-card/80 shadow-sm dark:shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-base font-semibold tracking-tight">
                Daily Quiz Attempts
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Last 30 days performance trend
              </CardDescription>
            </div>
            {totalAttempts > 0 && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${
                  trendIncrease >= 0
                    ? "bg-green-100/80 dark:bg-green-950/60 text-green-700 dark:text-green-400"
                    : "bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                }`}
              >
                {trendIncrease >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {trendIncrease >= 0 ? "+" : ""}
                  {trendPercent}% vs last week
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 pt-6 pb-6 px-6">
          {dailyLoading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : last14Days && last14Days.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={last14Days}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="colorAttempts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={lineColor}
                      stopOpacity={0.15}
                    />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                  horizontalPoints={[0]}
                />
                <XAxis
                  dataKey="displayDate"
                  stroke={textColor}
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  stroke={textColor}
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          className={`px-4 py-3 rounded-lg border shadow-lg ${
                            theme === "dark"
                              ? "bg-slate-900/95 border-slate-700"
                              : "bg-white/95 border-slate-200"
                          }`}
                        >
                          <p className="text-xs font-semibold text-muted-foreground">
                            {data.displayDate}
                          </p>
                          <p
                            className="text-sm font-bold mt-1"
                            style={{ color: lineColor }}
                          >
                            {data.attempts} attempt
                            {data.attempts !== 1 ? "s" : ""}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={{ fill: lineColor, r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No attempt data available in the last 30 days
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Summary Section */}
      {totalAttempts > 0 && (
        <div className="lg:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Total Attempts Card */}
          <Card className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 shadow-sm dark:shadow-md border-blue-200/50 dark:border-blue-800/50 overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Attempts
                  </p>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalAttempts}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Last 30 days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Average Per Day Card */}
          <Card className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 shadow-sm dark:shadow-md border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Average/Day
                  </p>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {averageAttempts}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Daily average
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Peak Day Card */}
          <Card className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 shadow-sm dark:shadow-md border-orange-200/50 dark:border-orange-800/50 overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Peak Day
                  </p>
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                    <svg
                      className="w-4 h-4 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {peakAttempts}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Highest attempts
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
