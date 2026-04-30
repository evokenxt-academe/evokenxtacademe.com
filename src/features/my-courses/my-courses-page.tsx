"use client";

import { useMyCourses } from "./hooks";
import { CourseCard } from "./components/course-card";
import { LoadingSkeleton } from "./components/loading-skeleton";
import { EmptyState } from "./components/empty-state";
import { ErrorState } from "./components/error-state";

export default function MyCoursesPage() {
  const { data: courses, isLoading, error, refetch } = useMyCourses();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          Continue your learning journey
        </p>
      </div>

      {/* ── Loading ─────────────────────────────────── */}
      {isLoading && <LoadingSkeleton />}

      {/* ── Error ───────────────────────────────────── */}
      {!isLoading && error && <ErrorState onRetry={() => refetch()} />}

      {/* ── Empty ───────────────────────────────────── */}
      {!isLoading && !error && courses && courses.length === 0 && (
        <EmptyState />
      )}

      {/* ── Course grid ─────────────────────────────── */}
      {!isLoading && !error && courses && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.enrollmentId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
