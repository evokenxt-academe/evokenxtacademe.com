"use client";

import {
  IconBook2,
  IconTrophy,
  IconTargetArrow,
  IconClock,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/features/student/types/dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const STAT_ITEMS = [
  {
    key: "enrolled" as const,
    label: "Enrolled Courses",
    icon: IconBook2,
    getValue: (s: DashboardStats) => String(s.enrolledCourses),
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: IconTrophy,
    getValue: (s: DashboardStats) => String(s.completedCourses),
  },
  {
    key: "score" as const,
    label: "Avg. Score",
    icon: IconTargetArrow,
    getValue: (s: DashboardStats) =>
      s.averageScore > 0 ? `${s.averageScore}%` : "—",
  },
  {
    key: "time" as const,
    label: "Learning Time",
    icon: IconClock,
    getValue: (s: DashboardStats) => formatTime(s.totalLearningMinutes),
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_ITEMS.map((item) => (
        <Card
          key={item.key}
          className="transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <item.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold tabular-nums tracking-tight">
                {item.getValue(stats)}
              </div>
              <div className="text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
