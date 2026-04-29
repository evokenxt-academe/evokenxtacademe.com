"use client";

import Link from "next/link";
import {
  IconStar,
  IconUsers,
  IconClock,
  IconBookmark,
  IconShare,
  IconPlayerPlay,
  IconBook,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { CourseDetail } from "@/features/student/types/course-detail";

interface CourseHeroProps {
  course: CourseDetail;
}

export function CourseHero({ course }: CourseHeroProps) {
  const initials = course.instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <section aria-label="Course overview" className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      {/* Text content */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{course.level}</Badge>
          <Badge variant="secondary">{course.category}</Badge>
          <Badge variant="outline">{course.duration}</Badge>
        </div>

        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
          {course.title}
        </h1>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {course.description}
        </p>

        {/* Instructor mini */}
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {course.instructor.name}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IconStar className="size-3.5 fill-amber-400 text-amber-400" />
            {course.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconUsers className="size-3.5" />
            {course.studentsCount.toLocaleString()} students
          </span>
          <span className="inline-flex items-center gap-1">
            <IconBook className="size-3.5" />
            {course.lessonsCount} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <IconClock className="size-3.5" />
            {course.duration}
          </span>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="lg" asChild>
            <Link href={`/dashboard/courses/${course.id}/learn`}>
              <IconPlayerPlay data-icon="inline-start" />
              Continue Learning
            </Link>
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Add to wishlist">
            <IconBookmark />
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Share course">
            <IconShare />
          </Button>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl border bg-muted lg:w-[340px]">
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <IconPlayerPlay className="size-10 opacity-30" />
        </div>
      </div>
    </section>
  );
}
