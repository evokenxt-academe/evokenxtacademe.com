"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizStats } from "@/hooks/useQuizzes";
import { FileText, HelpCircle, Users, TrendingUp } from "lucide-react";

const statCards = [
  { key: "totalQuizzes", label: "Total Quizzes", icon: FileText, weeklyKey: "weeklyQuizzes" },
  { key: "totalQuestions", label: "Total Questions", icon: HelpCircle, weeklyKey: "weeklyQuestions" },
  { key: "totalAttempts", label: "Total Attempts", icon: Users, weeklyKey: "weeklyAttempts" },
  { key: "avgScore", label: "Avg Score", icon: TrendingUp, weeklyKey: null, suffix: "%" },
] as const;

export function QuizStatsRow() {
  const { data: stats, isLoading } = useQuizStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((s) => (
        <Card key={s.key} className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
            <s.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.[s.key] ?? 0}{s.suffix ?? ""}
                </div>
                {s.weeklyKey && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{(stats as any)?.[s.weeklyKey] ?? 0} this week
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
