"use client";
import { useMyCourses } from "./hooks";
import { CourseCard } from "./components/course-card";
import { LoadingSkeleton } from "./components/loading-skeleton";
import { EmptyState } from "./components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyCoursesPage() {
  const { data, isLoading, error, refetch } = useMyCourses();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Continue learning your enrolled courses.
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    console.error("MyCoursesPage: failed to load courses", error);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Continue learning your enrolled courses.
          </p>
        </div>
        <Card className="rounded-xl border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Unable to load courses</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Please try again. If the problem persists, check your connection.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Continue learning your enrolled courses.
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          Continue learning your enrolled courses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((course) => (
          <CourseCard key={course.enrollmentId} course={course} />
        ))}
      </div>
    </div>
  );
}
