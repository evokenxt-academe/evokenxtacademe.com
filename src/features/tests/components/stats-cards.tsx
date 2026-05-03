"use client";

import {
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TestDashboardStats } from "@/features/tests/types";

interface StatsCardsProps {
  stats: TestDashboardStats;
}

const STAT_ITEMS = [
  {
    key: "totalTests" as const,
    label: "Total Tests",
    icon: ClipboardList,
    format: (v: number) => String(v),
    iconClass: "text-zinc-500",
    bgClass: "bg-zinc-100 dark:bg-zinc-800",
  },
  {
    key: "completedTests" as const,
    label: "Completed",
    icon: CheckCircle2,
    format: (v: number) => String(v),
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "averageScore" as const,
    label: "Average Score",
    icon: TrendingUp,
    format: (v: number) => `${v}%`,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    key: "bestScore" as const,
    label: "Best Score",
    icon: Trophy,
    format: (v: number) => `${v}%`,
    iconClass: "text-amber-600",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
  },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <Card
            key={item.key}
            className="rounded-xl border-border/50 shadow-none"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold leading-none tracking-tight">
                    {item.format(value)}
                  </p>
                </div>
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.bgClass}`}
                >
                  <Icon className={`size-5 ${item.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
