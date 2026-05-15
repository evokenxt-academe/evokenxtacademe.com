"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Star, Users, Globe } from "lucide-react";
import type { CourseDetailData } from "@/lib/supabase/queries/course-detail";

interface CourseHeroProps {
  course: CourseDetailData;
}

export function CourseHero({ course }: CourseHeroProps) {
  return (
    <div className="space-y-5">

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {course.program_body && (
          <Badge className="font-semibold text-xs uppercase tracking-wide">
            {course.program_body}
          </Badge>
        )}
        {course.level_label && (
          <Badge variant="outline" className="text-xs">
            {course.level_label}
          </Badge>
        )}
        {course.is_featured && (
          <Badge variant="secondary" className="text-xs">
            Featured
          </Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
        {course.title}
      </h1>

      {/* Short description */}
      {course.short_description && (
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          {course.short_description}
        </p>
      )}

      {/* Meta row: rating + students + language */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-amber-600">
            {course.avg_rating > 0 ? course.avg_rating.toFixed(1) : "New"}
          </span>
          <div className="flex gap-px">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.round(course.avg_rating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-none text-muted-foreground/40"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {course.total_students.toLocaleString()} student
            {course.total_students !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Language */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span>{course.language}</span>
        </div>
      </div>

      {/* Instructor line */}
      <div className="flex items-center gap-2.5 pt-1">
        <Avatar className="h-7 w-7">
          {course.instructor_avatar && (
            <AvatarImage
              src={course.instructor_avatar}
              alt={course.instructor_name}
            />
          )}
          <AvatarFallback className="text-[10px] font-semibold">
            {course.instructor_name?.charAt(0).toUpperCase() || "I"}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          Created by{" "}
          <span className="font-medium text-foreground underline-offset-2 hover:underline">
            {course.instructor_name}
          </span>
        </p>
      </div>
    </div>
  );
}
