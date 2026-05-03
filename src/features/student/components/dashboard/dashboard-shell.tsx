"use client";

import Link from "next/link";
import { IconArrowRight, IconPlayerPlay } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useDashboardData, useRealtimeUpdates } from "@/features/student/hooks/use-dashboard";
import { StatsCards } from "./stats-cards";
import { WeeklyActivityChart } from "./weekly-activity-chart";
import { CourseProgressList } from "./course-progress-list";
import { ActivityFeed } from "./activity-feed";
import { QuizPerformanceChart } from "./quiz-performance-chart";
import { LiveSection } from "./live-section";
import type { DashboardPageData } from "@/features/student/types/dashboard";

interface DashboardShellProps {
  initialData: DashboardPageData;
}

export function DashboardShell({ initialData }: DashboardShellProps) {
  const { data } = useDashboardData(initialData);
  useRealtimeUpdates(data.enrolledCourseIds);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Welcome header */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {data.profileName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your progress, review performance, and continue learning.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={data.continueHref}>
              Continue learning
              <IconPlayerPlay className="ml-1.5 size-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">
              Browse courses
              <IconArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats cards */}
      <StatsCards stats={data.stats} />

      {/* Weekly activity chart */}
      <WeeklyActivityChart data={data.weeklyActivity} />

      {/* Course progress + Quiz performance */}
      <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <CourseProgressList courses={data.courses} />
        <div className="flex flex-col gap-6">
          <QuizPerformanceChart scores={data.quizScores} overview={data.quizOverview} />
          <LiveSection streams={data.liveStreams} />
        </div>
      </section>

      {/* Activity feed */}
      <ActivityFeed items={data.activityFeed} />
    </div>
  );
}
