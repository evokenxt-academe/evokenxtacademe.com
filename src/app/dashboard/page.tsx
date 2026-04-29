import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconArrowRight,
  IconBook2,
  IconCertificate,
  IconChevronRight,
  IconCircleCheckFilled,
  IconClock,
  IconDownload,
  IconHistory,
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
  CardFooter,
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
import { Separator } from "@/components/ui/separator";
import { ProgressRing } from "@/components/progress-ring";
import {
  fetchStudentDashboardData,
  formatCurrencyINR,
  formatDurationCompact,
  formatWatchTimeCompact,
} from "@/features/student/lib/lms-data";

export const metadata: Metadata = {
  title: "Dashboard — Evoke Edu Global",
  description:
    "Track your learning progress, upcoming sessions, certificates, and recent activity.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dashboard = await fetchStudentDashboardData(supabase, user.id);

  // ─── Derived data ────────────────────────────────────────────────
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
    : "/courses";

  const activeCourses = dashboard.overview.enrolledCourses.slice(0, 4);
  const featuredCourses = dashboard.exploreCourses.slice(0, 3);
  const upcomingStreams = dashboard.upcomingStreams.slice(0, 3);
  const recentQuizAttempts = dashboard.latestQuizAttempts.slice(0, 3);

  // Fetch certificates separately
  const { data: certificates } = await supabase
    .from("certificates")
    .select("id, cert_url, issued_at, course:courses(id, name, slug)")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })
    .limit(5);

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from("lecture_progress")
    .select(
      `lecture_id, is_completed, watched_seconds, last_watched_at,
       lecture:lectures(id, title, duration_sec,
         section:sections(id, title, course_id,
           course:courses(id, name, slug)
         )
       )`,
    )
    .eq("user_id", user.id)
    .not("last_watched_at", "is", null)
    .order("last_watched_at", { ascending: false })
    .limit(5);

  const certList = (certificates ?? []) as unknown as Array<{
    id: string;
    cert_url: string;
    issued_at: string;
    course: { id: string; name: string; slug: string } | null;
  }>;

  // Normalize recent activity
  type ActivityItem = {
    lectureId: string;
    lectureTitle: string;
    courseName: string;
    courseSlug: string;
    watchedSeconds: number;
    isCompleted: boolean;
    lastWatchedAt: string;
  };

  const activityItems: ActivityItem[] = (recentActivity ?? [])
    .map((row) => {
      const lecture = row.lecture as unknown as Record<string, unknown> | null;
      if (!lecture) return null;
      const section = lecture.section as unknown as Record<
        string,
        unknown
      > | null;
      if (!section) return null;
      const course = section.course as unknown as Record<
        string,
        unknown
      > | null;
      if (!course) return null;

      return {
        lectureId: String(lecture.id ?? ""),
        lectureTitle: String(lecture.title ?? ""),
        courseName: String(course.name ?? ""),
        courseSlug: String(course.slug ?? ""),
        watchedSeconds: Number(row.watched_seconds ?? 0),
        isCompleted: row.is_completed === true,
        lastWatchedAt: String(row.last_watched_at ?? ""),
      };
    })
    .filter(
      (item): item is ActivityItem => item !== null && item.lectureId !== "",
    );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ═══════════════════════════════════════════════════════════
          Welcome + Overall Progress
         ═══════════════════════════════════════════════════════════ */}
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
                  <IconPlayerPlay data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/courses">
                  Browse courses
                  <IconArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall progress
            </CardTitle>
            <Badge variant="outline">
              {dashboard.continueCourse ? "Keep going" : "Start now"}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={overallProgressPercent}
                size={72}
                strokeWidth={6}
              />
              <div>
                <div className="text-3xl font-semibold">
                  {overallProgressPercent}%
                </div>
                <div className="text-sm text-muted-foreground">complete</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-medium">
                  {dashboard.overview.completedLectures}/
                  {dashboard.overview.totalLectures}
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

      {/* ═══════════════════════════════════════════════════════════
          Stat cards
         ═══════════════════════════════════════════════════════════ */}
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
                <div className="text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Active Courses + Sidebar
         ═══════════════════════════════════════════════════════════ */}
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* ── Active Courses ───────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>Active Courses</CardTitle>
                <CardDescription>
                  Resume your current enrollments.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/courses">
                  View all <IconArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeCourses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeCourses.map((enrollment) => {
                    const course = enrollment.course;
                    const continueLectureId =
                      enrollment.progress.continueLectureId;
                    const learnHref = continueLectureId
                      ? `/learn/${course.slug}/${continueLectureId}`
                      : `/learn/${course.slug}`;

                    return (
                      <Link
                        href={learnHref}
                        key={course.id}
                        className="group block"
                      >
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="flex items-center gap-4 p-4">
                            <ProgressRing
                              value={enrollment.progress.progressPercent}
                              size={48}
                              strokeWidth={4}
                              className="shrink-0"
                            />
                            <div className="min-w-0 flex-1 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="truncate font-medium">
                                  {course.name}
                                </h3>
                                <span className="shrink-0 text-lg font-semibold tabular-nums">
                                  {enrollment.progress.progressPercent}%
                                </span>
                              </div>
                              <Progress
                                value={enrollment.progress.progressPercent}
                                className="h-1.5"
                              />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {enrollment.progress.completedLectures}/
                                  {enrollment.progress.totalLectures} lessons
                                </span>
                                <span>
                                  {formatDurationCompact(
                                    enrollment.progress.totalDurationSec,
                                  )}
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

          {/* ── Recent Activity ──────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconHistory className="size-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your last watched lectures.</CardDescription>
            </CardHeader>
            <CardContent>
              {activityItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {activityItems.map((item) => (
                    <Link
                      key={item.lectureId}
                      href={`/learn/${item.courseSlug}/${item.lectureId}`}
                      className="group block"
                    >
                      <div className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {item.isCompleted ? (
                            <IconCircleCheckFilled className="size-4 text-emerald-500" />
                          ) : (
                            <IconPlayerPlay className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {item.lectureTitle}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.courseName}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {new Date(item.lastWatchedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity yet. Start a course to see your progress
                  here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Certificates ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconCertificate className="size-4 text-primary" />
                Certificates Earned
              </CardTitle>
              <CardDescription>
                Download your completion certificates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {certList.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {cert.course?.name ?? "Course"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Issued{" "}
                          {new Date(cert.issued_at).toLocaleDateString(
                            "en-IN",
                            {
                              dateStyle: "medium",
                            },
                          )}
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={cert.cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconDownload data-icon="inline-start" />
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete a course to earn your first certificate.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Explore */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explore More</CardTitle>
              <CardDescription>
                Courses you haven&apos;t enrolled in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featuredCourses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {featuredCourses.map((course) => (
                    <Link
                      key={course.id}
                      href="/courses"
                      className="group block"
                    >
                      <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <IconBook2 className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {course.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrencyINR(
                              course.discountPrice || course.price,
                            )}
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
                Live Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingStreams.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {upcomingStreams.map((stream) => (
                    <div key={stream.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {stream.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="shrink-0 capitalize"
                        >
                          {stream.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stream.startedAt ||
                        stream.endedAt ||
                        stream.scheduledAt
                          ? new Date(
                              stream.startedAt ||
                                stream.endedAt ||
                                stream.scheduledAt ||
                                "",
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Awaiting broadcast"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No live classes right now.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quiz Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-semibold">
                    {dashboard.quizzesPublished}
                  </div>
                  <div className="text-xs text-muted-foreground">Published</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">
                    {dashboard.quizzesAttempted}
                  </div>
                  <div className="text-xs text-muted-foreground">Attempted</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">
                    {dashboard.quizzesPassed}
                  </div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
              </div>

              {recentQuizAttempts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {recentQuizAttempts.map((attempt) => (
                    <div
                      key={`${attempt.quizId}-${attempt.submittedAt || "latest"}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {attempt.quizTitle}
                        </div>
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
