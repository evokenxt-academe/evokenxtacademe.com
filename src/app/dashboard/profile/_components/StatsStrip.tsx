import { Card, CardContent } from "@/components/ui/card";
import { Clock, BookOpen, ClipboardCheck, Trophy, type LucideIcon } from "lucide-react";

import type { ProfileStats } from "./types";

interface StatsStripProps {
  stats: ProfileStats;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
}

function StatCard({ label, value, icon: Icon, iconColorClass, iconBgClass }: StatCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`p-3 rounded-xl ${iconBgClass} ${iconColorClass} flex items-center justify-center shrink-0`}>
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">{label}</span>
        </div>
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
        icon={Clock}
        iconColorClass="text-blue-600 dark:text-blue-400"
        iconBgClass="bg-blue-50 dark:bg-blue-950/20"
      />
      <StatCard
        label="Courses enrolled"
        value={String(stats.coursesEnrolled)}
        icon={BookOpen}
        iconColorClass="text-emerald-600 dark:text-emerald-400"
        iconBgClass="bg-emerald-50 dark:bg-emerald-950/20"
      />
      <StatCard
        label="Quizzes attempted"
        value={String(stats.quizzesAttempted)}
        icon={ClipboardCheck}
        iconColorClass="text-amber-600 dark:text-amber-400"
        iconBgClass="bg-amber-50 dark:bg-amber-950/20"
      />
      <StatCard 
        label="Certificates" 
        value={String(stats.certificates)} 
        icon={Trophy}
        iconColorClass="text-violet-600 dark:text-violet-400"
        iconBgClass="bg-violet-50 dark:bg-violet-950/20"
      />
    </div>
  );
}
