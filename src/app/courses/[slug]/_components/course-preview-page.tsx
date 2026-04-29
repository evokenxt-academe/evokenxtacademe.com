"use client";

import { useMemo } from "react";
import { useCourseBySlug } from "@/features/courses/hooks";
import type { Course } from "@/features/courses/types";
import { CourseHeader } from "./course-header";
import { CurriculumAccordion } from "./curriculum-accordion";
import { InstructorCard } from "./instructor-card";
import { ReviewSection } from "./review-section";
import { CourseSidebarCard } from "./course-sidebar-card";
import { CoursePreviewSkeleton } from "./course-preview-skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconBook } from "@tabler/icons-react";
import Link from "next/link";

interface CoursePreviewPageProps {
  slug: string;
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getLearningItems(course: Course) {
  const lectureTitles = course.sections
    .flatMap((section) => section.lectures)
    .map((lecture) => lecture.title)
    .filter((title) => title && title.trim().length > 0);

  const unique = Array.from(new Set(lectureTitles));
  if (unique.length > 0) return unique.slice(0, 6);

  const sectionTitles = course.sections
    .map((section) => section.title)
    .filter((title) => title && title.trim().length > 0);

  return sectionTitles.slice(0, 6);
}

export function CoursePreviewPage({ slug }: CoursePreviewPageProps) {
  const { data: course, isLoading, error } = useCourseBySlug(slug);

  const stats = useMemo(() => {
    if (!course) {
      return {
        totalLectures: 0,
        totalResources: 0,
        totalDuration: "0m",
        ratingAverage: null as number | null,
        ratingCount: 0,
      };
    }

    const allLectures = course.sections.flatMap((section) => section.lectures);
    const totalDurationSeconds = allLectures.reduce(
      (sum, lecture) => sum + (lecture.duration_sec ?? 0),
      0,
    );
    const totalResources = allLectures.reduce(
      (sum, lecture) => sum + (lecture.resources?.length ?? 0),
      0,
    );
    const ratingCount = course.reviews?.length ?? 0;
    const ratingAverage = ratingCount
      ? course.reviews!.reduce((sum, review) => sum + review.rating, 0) /
        ratingCount
      : null;

    return {
      totalLectures: allLectures.length,
      totalResources,
      totalDuration: formatDuration(totalDurationSeconds),
      ratingAverage,
      ratingCount,
    };
  }, [course]);

  if (isLoading) {
    return <CoursePreviewSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-4 py-16">
        <Empty className="w-full rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBook />
            </EmptyMedia>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>
              The course you are looking for is unavailable or unpublished.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/courses">Back to catalog</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const learningItems = getLearningItems(course);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-24 md:px-6">
        <CourseHeader course={course} stats={stats} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-8">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>About this course</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {course.description ||
                    "A focused curriculum designed to build core capability and exam confidence."}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>What you will learn</CardTitle>
              </CardHeader>
              <CardContent>
                {learningItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {learningItems.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 rounded-full bg-muted-foreground" />
                        <p className="text-sm text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Learning outcomes will be available soon.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <CurriculumAccordion sections={course.sections} />
              </CardContent>
            </Card>

            <InstructorCard
              instructor={course.instructor}
              studentCount={stats.ratingCount}
              courseCount={1}
            />

            <ReviewSection reviews={course.reviews ?? []} />
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
            <CourseSidebarCard course={course} stats={stats} />
          </aside>
        </div>

        <Separator />
      </main>
    </div>
  );
}
