"use client";

import Link from "next/link";
import { IconBook2, IconUser, IconStarFilled } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogCourse } from "@/lib/supabase/queries";
import { computeAverageRating, formatPriceINR } from "@/lib/supabase/queries";

// ─── Level display labels ──────────────────────────────────────────
const LEVEL_LABELS: Record<string, string> = {
  knowledge: "Knowledge",
  skills: "Skills",
  professional: "Professional",
};

// ─── Main Component ────────────────────────────────────────────────

interface CourseCardProps {
  course: CatalogCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const avgRating = computeAverageRating(course.reviews ?? []);
  const reviewCount = course.reviews?.length ?? 0;
  const sectionCount = course.sections?.length ?? 0;
  const effectivePrice = course.discount_price ?? course.price;

  return (
    <div className="group relative flex h-full flex-col rounded-none border border-border/50 bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-lg">
      <CardDecorator />
      <Link
        href={`/courses/${course.slug}`}
        className="flex flex-1 flex-col outline-none"
      >
        {/* ── Thumbnail ─────────────────────────────────────── */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <div
              className="size-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${course.thumbnail_url})` }}
              role="img"
              aria-label={course.name}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/50 text-muted-foreground/30 transition-transform duration-500 group-hover:scale-105">
              <IconBook2 className="size-12" stroke={1.5} />
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {course.level && (
              <Badge
                variant="secondary"
                className="border-transparent bg-background/90 text-xs font-medium backdrop-blur-sm"
              >
                {LEVEL_LABELS[course.level] ?? course.level}
              </Badge>
            )}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <CardHeader className="p-5 pb-3">
          <CardTitle className="line-clamp-2 text-lg leading-tight transition-colors group-hover:text-primary">
            {course.name}
          </CardTitle>
          <CardDescription className="mt-1.5 line-clamp-2 text-sm">
            {course.description ??
              "Comprehensive preparation with structured learning paths and expert guidance."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 p-5 py-0">
          {/* Instructor */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconUser className="size-4 shrink-0" stroke={1.5} />
            <span className="truncate">
              {course.instructor?.name ?? "Expert Faculty"}
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
            {avgRating !== null && (
              <div className="flex items-center gap-1">
                <IconStarFilled className="size-3.5 text-amber-500" />
                <span className="font-medium text-foreground">{avgRating}</span>
                <span>({reviewCount})</span>
              </div>
            )}
            {sectionCount > 0 && (
              <div className="flex items-center gap-1">
                <IconBook2 className="size-3.5" stroke={1.5} />
                <span>
                  {sectionCount} {sectionCount === 1 ? "module" : "modules"}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <Separator className="mt-4" />

        {/* ── Footer ────────────────────────────────────────── */}
        <CardFooter className="flex items-center justify-between bg-muted/10 p-5">
          <div className="flex items-center gap-2">
            {course.discount_price ? (
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none">
                  {formatPriceINR(course.discount_price)}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground line-through">
                  {formatPriceINR(course.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold">
                {formatPriceINR(effectivePrice)}
              </span>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 font-medium transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            View Course
          </Button>
        </CardFooter>
      </Link>
    </div>
  );
}

// ─── Skeleton variant ──────────────────────────────────────────────

export function CourseCardSkeleton() {
  return (
    <div className="group relative flex h-full flex-col rounded-none border border-border/50 bg-card">
      <CardDecorator />
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardHeader className="p-5 pb-3">
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-5/6" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-5 py-0">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-auto flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>
      <Separator className="mt-4" />
      <CardFooter className="flex items-center justify-between p-5">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </CardFooter>
    </div>
  );
}

const CardDecorator = () => (
  <div className="pointer-events-none absolute inset-0 z-10">
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-primary transition-all group-hover:size-3 group-active:size-3"></span>
  </div>
);
