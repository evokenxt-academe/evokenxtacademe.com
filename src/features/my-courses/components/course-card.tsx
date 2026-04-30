"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { MyCourse } from "../types";

// ── Helpers ──────────────────────────────────────────────

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

// ── Component ────────────────────────────────────────────

interface CourseCardProps {
  course: MyCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const lastAccessed = course.lastAccessedAt
    ? formatDistanceToNow(new Date(course.lastAccessedAt), {
        addSuffix: true,
      })
    : null;

  const continueHref = course.resumeLectureId
    ? `/learn/${course.slug}/${course.resumeLectureId}`
    : `/learn/${course.slug}`;

  return (
    <Card className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-border">
      {/* ── Thumbnail ─────────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No thumbnail
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant={course.isCompleted ? "default" : "secondary"}
            className="text-[11px]"
          >
            {course.isCompleted ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────── */}
      <CardContent className="flex flex-col gap-3 p-5">
        {/* Title + instructor */}
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
            {course.title}
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {course.instructorName}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
            <span className="font-medium text-foreground">
              {course.progressPercent}%
            </span>
          </div>
          <Progress value={course.progressPercent} className="h-1.5" />
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDuration(course.totalDurationSec)}</span>
          {lastAccessed ? (
            <span>{lastAccessed}</span>
          ) : (
            <span>Not started</span>
          )}
        </div>

        {/* Resume lecture hint */}
        {course.resumeLectureTitle && !course.isCompleted && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Resume:</span>{" "}
            {course.resumeLectureTitle}
          </p>
        )}
      </CardContent>

      {/* ── Footer CTA ────────────────────────────────── */}
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={continueHref}>
            {course.isCompleted ? "Review Course" : "Continue Learning"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
