import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconBook2,
  IconClock,
  IconPlayerPlay,
  IconTargetArrow,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  fetchStudentLearningOverview,
  formatDurationCompact,
} from "@/features/student/lib/lms-data";

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const overview = await fetchStudentLearningOverview(supabase, user.id);

  const overallProgressPercent =
    overview.totalLectures > 0
      ? Math.round((overview.completedLectures / overview.totalLectures) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Active enrollments with lecture-level progress from Supabase.
          </p>
        </div>
        <Card className="w-fit">
          <CardContent className="p-4 text-right">
            <div className="text-3xl font-semibold">{overallProgressPercent}%</div>
            <div className="text-xs text-muted-foreground">
              {overview.completedLectures}/{overview.totalLectures} lessons
            </div>
          </CardContent>
        </Card>
      </div>

      {overview.enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.enrolledCourses.map((enrollment) => {
            const course = enrollment.course;
            const continueLectureId = enrollment.progress.continueLectureId;
            const continueHref = continueLectureId
              ? `/learn/${course.slug}/${continueLectureId}`
              : `/learn/${course.slug}`;

            return (
              <Link href={continueHref} key={course.id} className="group block">
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-video bg-muted">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <IconBook2 className="size-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <Badge variant={enrollment.progress.isCompleted ? "default" : "secondary"}>
                        {enrollment.progress.isCompleted ? "Completed" : "In progress"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="space-y-3 p-4">
                    <div>
                      <Badge variant="outline" className="mb-1 capitalize">
                        {course.level || "professional"}
                      </Badge>
                      <h4 className="line-clamp-2 font-medium leading-snug">
                        {course.name}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{enrollment.progress.progressPercent}% progress</span>
                        <span>{formatDurationCompact(enrollment.progress.totalDurationSec)}</span>
                      </div>
                      <Progress value={enrollment.progress.progressPercent} className="h-1.5" />
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 truncate">
                        <IconTargetArrow className="size-4 shrink-0 text-primary" />
                        {enrollment.progress.continueLectureTitle || "Start this course"}
                      </p>
                      <p className="flex items-center gap-2">
                        <IconClock className="size-4 shrink-0 text-primary" />
                        {formatDurationCompact(enrollment.progress.watchedSeconds)} watched
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="mx-auto w-full max-w-lg border-dashed">
          <CardContent className="space-y-4 py-12 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
              <IconBook2 className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-semibold">No courses yet</h4>
              <p className="text-sm text-muted-foreground">
                You have not enrolled in any courses yet. Explore the catalog.
              </p>
            </div>
            <Button asChild>
              <Link href="/courses">Explore catalog</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
