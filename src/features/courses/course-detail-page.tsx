"use client";

/**
 * 🎓 Course Detail Page (Dynamic)
 *
 * Fully dynamic course details powered by Supabase + TanStack Query
 * - Fetches from database (not mock data)
 * - Shows loading skeleton during fetch
 * - Handles errors gracefully
 * - Transforms DB data to UI models
 * - Displays all course information with instructor & reviews
 */

import { useCallback, use } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  CourseHero,
  CourseProgressCard,
  CourseAbout,
  CurriculumAccordion,
  InstructorCard,
  ReviewSummary,
  RelatedCourses,
  CourseSidebarCard,
} from "@/features/student/components/course-detail";

import { useCourseBySlug } from "@/features/courses/hooks";
import { transformCourseToUI } from "@/features/courses/transform";
import { CourseDetailLoadingSkeleton } from "@/features/courses/loading-skeleton";
import { CourseDetailError } from "@/features/courses/error";

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";

  // Use the hook to fetch course data
  const {
    data: dbCourse,
    isLoading,
    error,
    refetch,
  } = useCourseBySlug(slug || "");

  // Transform database model to UI model
  const course = dbCourse ? transformCourseToUI(dbCourse) : null;

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return <CourseDetailLoadingSkeleton />;
  }

  // Error state
  if (error || !course) {
    return (
      <CourseDetailError
        error={error}
        slug={slug || ""}
        onRetry={handleRetry}
      />
    );
  }

  // Success state - render the course detail page
  return (
    <main className="flex flex-col gap-8 p-4 pb-12 lg:p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/courses">Courses</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero */}
      <CourseHero course={course} />

      {/* Progress overview (mobile) */}
      <div className="lg:hidden">
        <CourseProgressCard course={course} />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left — main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <CourseAbout
            about={course.about}
            learningOutcomes={course.learningOutcomes}
          />

          {/* Curriculum */}
          {course.modules.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <CurriculumAccordion modules={course.modules} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Curriculum</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                No curriculum content available yet.
              </CardContent>
            </Card>
          )}

          {/* Instructor */}
          {course.instructor.name && (
            <InstructorCard instructor={course.instructor} />
          )}

          {/* Reviews */}
          {course.reviewSummary.totalReviews > 0 ? (
            <ReviewSummary summary={course.reviewSummary} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                No reviews yet. Be the first to review this course!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — sticky sidebar */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-6">
            <CourseSidebarCard course={course} />
          </div>
        </aside>
      </div>

      <Separator />

      {/* Related courses */}
      {course.relatedCourses.length > 0 && (
        <RelatedCourses courses={course.relatedCourses} />
      )}
    </main>
  );
}
