import { Card, CardContent } from "@/components/ui/card";

import type { ProfileStats } from "./types";

interface StatsStripProps {
  stats: ProfileStats;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total watch hours"
        value={stats.totalWatchHours.toFixed(1)}
      />
      <StatCard
        label="Courses enrolled"
        value={String(stats.coursesEnrolled)}
      />
      <StatCard
        label="Quizzes attempted"
        value={String(stats.quizzesAttempted)}
      />
      <StatCard label="Certificates" value={String(stats.certificates)} />
    </div>
  );
}
