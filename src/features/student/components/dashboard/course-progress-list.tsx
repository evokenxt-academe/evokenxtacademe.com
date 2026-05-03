"use client";

import Link from "next/link";
import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseProgressItem } from "@/features/student/types/dashboard";

interface CourseProgressListProps {
  courses: CourseProgressItem[];
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function CourseProgressList({ courses }: CourseProgressListProps) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-medium">
            Course Progress
          </CardTitle>
          <CardDescription>
            Continue where you left off
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/courses">
            View all <IconArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const href = course.continueLectureId
                ? `/learn/${course.courseSlug}/${course.continueLectureId}`
                : `/learn/${course.courseSlug}`;

              return (
                <div
                  key={course.courseId}
                  className="group flex flex-col gap-2.5 rounded-xl border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium">
                        {course.courseName}
                      </h3>
                      {course.continueLectureTitle && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Next: {course.continueLectureTitle}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {course.progressPercent}%
                    </span>
                  </div>

                  <Progress value={course.progressPercent} className="h-1.5" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {course.completedLectures}/{course.totalLectures} lessons
                      {" · "}
                      {formatDuration(course.totalDurationSec)}
                    </span>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Link href={href}>
                        Continue
                        <IconArrowRight className="ml-1 size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconSparkles />
              </EmptyMedia>
              <EmptyTitle>No active enrollments</EmptyTitle>
              <EmptyDescription>
                Explore the course catalog to start learning.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/courses">Explore courses</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

export function CourseProgressListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-xl border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
