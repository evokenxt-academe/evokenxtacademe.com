"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MyCourse } from "../types";

interface CourseCardProps {
  course: MyCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const lastAccessed = course.lastAccessedAt
    ? formatDistanceToNow(new Date(course.lastAccessedAt), {
        addSuffix: true,
      })
    : null;

  return (
    <Card className="rounded-xl border border-border/60 bg-card transition-colors hover:border-border">
      <CardHeader className="p-4">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No thumbnail
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {course.instructorName}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {course.completedLessons} of {course.totalLessons} lessons
            </span>
            <span>{course.progressPercent}%</span>
          </div>
          <Progress value={course.progressPercent} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{course.totalLessons} lessons</span>
          {lastAccessed ? (
            <span>Last accessed {lastAccessed}</span>
          ) : (
            <span>Not started</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4">
        <Button asChild className="w-full">
          <Link href={`/dashboard/courses/${course.courseId}`}>
            Continue Learning
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
