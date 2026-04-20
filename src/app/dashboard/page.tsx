import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconArrowRight,
  IconBook2,
  IconCertificate,
  IconChecklist,
  IconChevronRight,
  IconCircleCheckFilled,
  IconClock,
  IconLivePhoto,
  IconPlayerPlay,
  IconSparkles,
  IconTargetArrow,
  IconTrophy,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  fetchStudentDashboardData,
  formatCurrencyINR,
  formatDurationCompact,
  formatWatchTimeCompact,
} from "@/features/student/lib/lms-data";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dashboard = await fetchStudentDashboardData(supabase, user.id);

  const profileName =
    dashboard.overview.profile?.name?.split(" ")[0] ||
    user.user_metadata?.full_name?.split(" ")?.[0] ||
    "Student";

  const overallProgressPercent =
    dashboard.overview.totalLectures > 0
      ? Math.round(
          (dashboard.overview.completedLectures /
            dashboard.overview.totalLectures) *
            100,
        )
      : 0;

  const continueHref = dashboard.continueCourse?.progress.continueLectureId
    ? `/learn/${dashboard.continueCourse.course.slug}/${dashboard.continueCourse.progress.continueLectureId}`
    : "/my-courses";

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            Personalized Learning
          </Badge>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profileName}. You are at {overallProgressPercent}%
              overall completion.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/courses">Browse courses</Link>
          </Button>
          <Button asChild>
            <Link href={continueHref}>
              Continue learning
              <IconPlayerPlay data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Courses",
            value: dashboard.overview.enrolledCourses.length,
            icon: IconBook2,
          },
          {
            label: "Watch time",
            value: formatWatchTimeCompact(dashboard.overview.totalWatchSeconds),
            icon: IconClock,
          },
          {
            label: "Completed",
            value: dashboard.overview.completedCourses,
            icon: IconTrophy,
          },
          {
            label: "Certificates",
            value: dashboard.certificatesEarned,
            icon: IconCertificate,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon />
              </div>
              <div className="flex flex-col gap-1">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active courses</CardTitle>
              <CardDescription>
                Pick up where you left off with your current enrollments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.overview.enrolledCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboard.overview.enrolledCourses.map((enrollment) => {
                    const course = enrollment.course;
                    const continueLectureId =
                      enrollment.progress.continueLectureId;
                    const learnHref = continueLectureId
                      ? `/learn/${course.slug}/${continueLectureId}`
                      : `/learn/${course.slug}`;

                    return (
                      <Link href={learnHref} key={course.id}>
                        <Card className="h-full">
                          <CardContent className="flex flex-col gap-4 p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                                {course.thumbnailUrl ? (
                                  <img
                                    src={course.thumbnailUrl}
                                    alt={course.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <IconBook2 />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge variant="outline">
                                    {course.level || "professional"}
                                  </Badge>
                                  <Badge
                                    variant={
                                      enrollment.progress.isCompleted
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {enrollment.progress.isCompleted
                                      ? "Completed"
                                      : "In progress"}
                                  </Badge>
                                </div>
                                <h3 className="mt-2 line-clamp-2 font-medium">
                                  {course.name}
                                </h3>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Progress
                                </span>
                                <span>
                                  {enrollment.progress.progressPercent}%
                                </span>
                              </div>
                              <Progress
                                value={enrollment.progress.progressPercent}
                              />
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <span>
                                  {enrollment.progress.completedLectures}/
                                  {enrollment.progress.totalLectures} lessons
                                </span>
                                <span className="truncate">
                                  Continue:{" "}
                                  {enrollment.progress.continueLectureTitle ||
                                    "Start this course"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Empty className="rounded-lg border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconSparkles />
                    </EmptyMedia>
                    <EmptyTitle>No active enrollments</EmptyTitle>
                    <EmptyDescription>
                      Explore the course catalog to start learning with your
                      first enrollment.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild>
                      <Link href="/courses">Explore courses</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Explore more</CardTitle>
              <CardDescription>
                Courses you have not enrolled in yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {dashboard.exploreCourses.map((course) => (
                  <Link key={course.id} href="/courses">
                    <Card className="size-full">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <IconBook2 />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-medium">
                            {course.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {course.level || "professional"}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {formatCurrencyINR(
                              course.discountPrice || course.price,
                            )}
                          </div>
                          {course.discountPrice ? (
                            <div className="text-muted-foreground line-through">
                              {formatCurrencyINR(course.price)}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming live sessions</CardTitle>
              <CardDescription>
                Scheduled sessions linked to your learning path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {dashboard.upcomingStreams.length > 0 ? (
                  dashboard.upcomingStreams.slice(0, 3).map((stream) => (
                    <div
                      key={stream.id}
                      className="flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{stream.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {stream.courseName}
                          </div>
                        </div>
                        <Badge variant="outline">{stream.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stream.scheduledAt
                          ? new Date(stream.scheduledAt).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )
                          : "Schedule pending"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No scheduled live classes right now.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz performance</CardTitle>
              <CardDescription>
                Your current quiz activity and results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Card size="sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-semibold">
                      {dashboard.quizzesPublished}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Published
                    </div>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-semibold">
                      {dashboard.quizzesAttempted}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Attempted
                    </div>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-semibold">
                      {dashboard.quizzesPassed}
                    </div>
                    <div className="text-xs text-muted-foreground">Passed</div>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-4" />

              {dashboard.latestQuizAttempts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {dashboard.latestQuizAttempts.map((attempt) => (
                    <div
                      key={`${attempt.quizId}-${attempt.submittedAt || "latest"}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {attempt.quizTitle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {attempt.score}/{attempt.totalMarks}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {attempt.passed ? (
                          <IconCircleCheckFilled />
                        ) : (
                          <IconChevronRight />
                        )}
                        {attempt.passed ? "Passed" : "Review"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  You have not submitted any quiz attempts yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
