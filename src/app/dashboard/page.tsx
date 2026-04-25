import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconArrowRight,
  IconBook2,
  IconCertificate,
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

  const activeCourses = dashboard.overview.enrolledCourses.slice(0, 4);
  const featuredCourses = dashboard.exploreCourses.slice(0, 3);
  const upcomingStreams = dashboard.upcomingStreams.slice(0, 3);
  const recentQuizAttempts = dashboard.latestQuizAttempts.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Welcome + Stats */}
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              Welcome back, {profileName}
            </CardTitle>
            <CardDescription>
              Your learning progress, live sessions, certificates, and quiz
              activity — synced from Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={continueHref}>
                  Continue learning
                  <IconPlayerPlay className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/courses">
                  Browse courses
                  <IconArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall progress
            </CardTitle>
            <Badge variant="outline">
              {dashboard.continueCourse ? "Keep going" : "Start now"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-semibold">{overallProgressPercent}%</div>
            <Progress value={overallProgressPercent} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-medium">
                  {dashboard.overview.completedLectures}/{dashboard.overview.totalLectures}
                </div>
                <div className="text-muted-foreground">Lessons done</div>
              </div>
              <div>
                <div className="font-medium">
                  {formatWatchTimeCompact(dashboard.overview.totalWatchSeconds)}
                </div>
                <div className="text-muted-foreground">Watch time</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <IconTargetArrow className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Next:{" "}
                {dashboard.continueCourse?.progress.continueLectureTitle ||
                  "Explore the catalog to find your next course"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Active courses",
            value: dashboard.overview.enrolledCourses.length,
            icon: IconBook2,
          },
          {
            label: "Completed",
            value: dashboard.overview.completedCourses,
            icon: IconTrophy,
          },
          {
            label: "Watch time",
            value: formatWatchTimeCompact(dashboard.overview.totalWatchSeconds),
            icon: IconClock,
          },
          {
            label: "Certificates",
            value: dashboard.certificatesEarned,
            icon: IconCertificate,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{item.value}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Active Courses + Sidebar */}
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Active Courses</CardTitle>
              <CardDescription>Resume your current enrollments.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-courses">
                View all <IconArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeCourses.length > 0 ? (
              <div className="space-y-3">
                {activeCourses.map((enrollment) => {
                  const course = enrollment.course;
                  const continueLectureId = enrollment.progress.continueLectureId;
                  const learnHref = continueLectureId
                    ? `/learn/${course.slug}/${continueLectureId}`
                    : `/learn/${course.slug}`;

                  return (
                    <Link href={learnHref} key={course.id} className="group block">
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <IconBook2 className="size-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="truncate font-medium">{course.name}</h3>
                              <span className="shrink-0 text-lg font-semibold">
                                {enrollment.progress.progressPercent}%
                              </span>
                            </div>
                            <Progress value={enrollment.progress.progressPercent} className="h-1.5" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {enrollment.progress.completedLectures}/
                                {enrollment.progress.totalLectures} lessons
                              </span>
                              <span>
                                {formatDurationCompact(enrollment.progress.totalDurationSec)}
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
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconSparkles />
                  </EmptyMedia>
                  <EmptyTitle>No active enrollments</EmptyTitle>
                  <EmptyDescription>
                    Explore the course catalog to start learning.
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

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Explore */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explore More</CardTitle>
              <CardDescription>Courses you haven't enrolled in.</CardDescription>
            </CardHeader>
            <CardContent>
              {featuredCourses.length > 0 ? (
                <div className="space-y-3">
                  {featuredCourses.map((course) => (
                    <Link key={course.id} href="/courses" className="group block">
                      <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.name} className="size-full object-cover" />
                          ) : (
                            <IconBook2 className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{course.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrencyINR(course.discountPrice || course.price)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All published courses are in your library.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Live Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconLivePhoto className="size-4 text-primary" />
                Live Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingStreams.length > 0 ? (
                <div className="space-y-3">
                  {upcomingStreams.map((stream) => (
                    <div key={stream.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{stream.title}</span>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {stream.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stream.scheduledAt
                          ? new Date(stream.scheduledAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Schedule pending"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No scheduled live classes right now.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quiz Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-semibold">{dashboard.quizzesPublished}</div>
                  <div className="text-xs text-muted-foreground">Published</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">{dashboard.quizzesAttempted}</div>
                  <div className="text-xs text-muted-foreground">Attempted</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">{dashboard.quizzesPassed}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
              </div>

              {recentQuizAttempts.length > 0 ? (
                <div className="space-y-2">
                  {recentQuizAttempts.map((attempt) => (
                    <div
                      key={`${attempt.quizId}-${attempt.submittedAt || "latest"}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{attempt.quizTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {attempt.score}/{attempt.totalMarks}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {attempt.passed ? (
                          <IconCircleCheckFilled className="size-4 text-emerald-500" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                        {attempt.passed ? "Passed" : "Review"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quiz attempts yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
