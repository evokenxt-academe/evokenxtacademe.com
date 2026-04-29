"use client";

import type { Course } from "@/features/courses/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconBook,
  IconClock,
  IconFile,
  IconInfinity,
  IconLanguage,
  IconSchool,
} from "@tabler/icons-react";

interface CourseSidebarCardProps {
  course: Course;
  stats: {
    totalLectures: number;
    totalResources: number;
    totalDuration: string;
    ratingAverage: number | null;
    ratingCount: number;
  };
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLevel(level: Course["level"]) {
  return level ? level.charAt(0).toUpperCase() + level.slice(1) : "";
}

export function CourseSidebarCard({ course, stats }: CourseSidebarCardProps) {
  const hasDiscount =
    course.discount_price !== null && course.discount_price < course.price;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Enroll</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {formatPrice(hasDiscount ? course.discount_price : course.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(course.price)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button>Enroll Now</Button>
          <Button variant="outline">Preview Course</Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconClock />
            <span>{stats.totalDuration} of content</span>
          </div>
          <div className="flex items-center gap-2">
            <IconBook />
            <span>{stats.totalLectures} lectures</span>
          </div>
          <div className="flex items-center gap-2">
            <IconFile />
            <span>{stats.totalResources} resources</span>
          </div>
          <div className="flex items-center gap-2">
            <IconSchool />
            <span>Level: {formatLevel(course.level)}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconLanguage />
            <span>Language: English</span>
          </div>
          <div className="flex items-center gap-2">
            <IconInfinity />
            <span>Lifetime access</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
