"use client";

import type { Course } from "@/features/courses/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconArrowRight,
  IconClock,
  IconPlayerPlay,
  IconStarFilled,
  IconUsers,
} from "@tabler/icons-react";

interface CourseHeaderProps {
  course: Course;
  stats: {
    totalLectures: number;
    totalResources: number;
    totalDuration: string;
    ratingAverage: number | null;
    ratingCount: number;
  };
}

function formatLevel(level: Course["level"]) {
  return level ? level.charAt(0).toUpperCase() + level.slice(1) : "";
}

function formatRating(rating: number | null) {
  if (!rating) return "No ratings";
  return rating.toFixed(1);
}

function getInitials(name: string | null) {
  if (!name) return "IN";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function CourseHeader({ course, stats }: CourseHeaderProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{formatLevel(course.level)}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {course.name}
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button>
            Enroll Now
            <IconArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="outline">
            <IconPlayerPlay data-icon="inline-start" />
            Preview Course
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={course.instructor?.avatar ?? ""} />
            <AvatarFallback>
              {getInitials(course.instructor?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {course.instructor?.name || "Instructor"}
            </span>
            <span className="text-xs text-muted-foreground">
              Course Instructor
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconStarFilled />
            <span className="text-foreground">
              {formatRating(stats.ratingAverage)}
            </span>
            <span>({stats.ratingCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <IconUsers />
            <span>{stats.ratingCount} students</span>
          </div>
          <div className="flex items-center gap-2">
            <IconClock />
            <span>{stats.totalDuration} total</span>
          </div>
        </div>
      </div>
    </section>
  );
}
