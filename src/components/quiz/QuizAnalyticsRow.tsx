"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useQuizTypeDistribution } from "@/hooks/useQuizzes";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS: Record<string, string> = {
  practice: "hsl(var(--muted-foreground))",
  graded: "hsl(210, 60%, 50%)",
  mock_exam: "hsl(40, 80%, 50%)",
  final_exam: "hsl(0, 70%, 55%)",
};

export function QuizAnalyticsRow() {
  const { data: typeData, isLoading } = useQuizTypeDistribution();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-lg border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-sm font-medium">Quiz Type Distribution</CardTitle></CardHeader>
        <CardContent className="h-[250px]">
          {isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {(typeData ?? []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name] ?? `hsl(${i * 90}, 60%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border bg-card shadow-sm lg:col-span-2">
        <CardHeader><CardTitle className="text-sm font-medium">Daily Quiz Attempts (Last 30 Days)</CardTitle></CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Attempt trends chart will populate with data</p>
        </CardContent>
      </Card>
    </div>
  );
}
