"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  Download,
  Lock,
  Play,
  Share2,
  Bookmark,
  Trophy,
} from "lucide-react";

import type { DashboardViewModel } from "@/types/dashboard";
import { useDashboardSearchItems } from "@/components/dashboard-search-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { WatchHoursChart } from "./watch-hours-chart";
import { QuizPerformanceChart } from "./quiz-performance-chart";
import { CourseProgressChart } from "./course-progress-chart";
import { StudyStreakHeatmap } from "./study-streak-heatmap";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Stagger({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {children}
    </motion.div>
  );
}

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="h-full w-full max-w-[220px] opacity-90"
      aria-hidden
    >
      <circle cx="100" cy="80" r="70" fill="currentColor" fillOpacity="0.08" />
      <rect x="55" y="45" width="90" height="65" rx="8" fill="currentColor" fillOpacity="0.15" />
      <rect x="65" y="55" width="70" height="8" rx="4" fill="currentColor" fillOpacity="0.35" />
      <rect x="65" y="70" width="50" height="6" rx="3" fill="currentColor" fillOpacity="0.25" />
      <rect x="65" y="82" width="60" height="6" rx="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="145" cy="95" r="18" fill="currentColor" fillOpacity="0.2" />
      <path d="M138 95 L142 99 L152 88" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.5" />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 pb-24 md:px-6 md:pb-8 animate-pulse">
      {/* Hero card skeleton */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Stats cards skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 min-w-[200px] shrink-0 rounded-2xl md:min-w-0" />
        ))}
      </div>

      {/* Continue Learning title and cards skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 min-w-[280px] shrink-0 rounded-2xl md:min-w-0" />
          ))}
        </div>
      </div>

      {/* Charts row skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-2xl" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardClient({ data }: { data: DashboardViewModel }) {
  const router = useRouter();
  const { setItems } = useDashboardSearchItems();
  const [loading, setLoading] = React.useState(true);
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());
  const [shareCert, setShareCert] = React.useState<{ title: string; url: string } | null>(null);
  const [quizSort, setQuizSort] = React.useState<"name" | "date">("date");
  const [showAllQuizzes, setShowAllQuizzes] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [greet, setGreet] = React.useState("Good morning");

  React.useEffect(() => {
    setGreet(greeting());
  }, []);

  React.useEffect(() => {
    setItems(data.searchItems);
  }, [data.searchItems, setItems]);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const firstName = data.profile.name.split(" ")[0] || data.profile.name;
  const resumeHref = data.resume[0]
    ? `/learn/${data.resume[0].slug}?lecture=${encodeURIComponent(data.resume[0].lectureId)}&t=${encodeURIComponent(String(data.resume[0].resumeAtSeconds))}`
    : data.activeCourses[0]
      ? `/learn/${data.activeCourses[0].slug}`
      : "/dashboard/my-courses";

  const sortedQuizzes = [...data.quizResults].sort((a, b) => {
    if (quizSort === "name") return a.quizTitle.localeCompare(b.quizTitle);
    return Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
  });
  const visibleQuizzes = showAllQuizzes ? sortedQuizzes : sortedQuizzes.slice(0, 5);

  const toggleBookmark = (courseId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    toast.success("Bookmarked!");
  };

  const handleReminder = async (sessionId: string) => {
    setPendingAction(sessionId);
    await new Promise((r) => setTimeout(r, 600));
    setPendingAction(null);
    toast.success("Reminder set!");
  };

  const copyShareLink = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard!");
  };

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    {
      label: "Watch Hours",
      value: data.stats.watchHours.toFixed(1),
      change: data.stats.watchHoursChangePct,
      icon: Clock,
    },
    {
      label: "Courses Enrolled",
      value: String(data.stats.coursesEnrolled),
      change: data.stats.coursesChangePct,
      icon: BookOpen,
    },
    {
      label: "Quizzes Passed",
      value: String(data.stats.quizzesPassed),
      change: data.stats.quizzesPassedChangePct,
      icon: ClipboardList,
    },
    {
      label: "Certificates",
      value: String(data.stats.certificates),
      change: data.stats.certificatesChangePct,
      icon: Award,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 overflow-x-hidden px-4 py-6 pb-24 md:px-6 md:pb-8">
      {/* Hero */}
      <Stagger index={0}>
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-600 p-6 text-primary-foreground shadow-sm md:p-8">
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">
                {greet}, {firstName}
              </h1>
              <p className="text-sm text-primary-foreground/85 md:text-base">
                Ready to continue your learning journey?
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  asChild
                  className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm transition-all duration-200"
                >
                  <Link href={resumeHref}>
                    <Play className="size-4" data-icon="inline-start" />
                    Resume Learning
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>
            </div>
            <div className="hidden shrink-0 text-primary-foreground md:block">
              <HeroIllustration />
            </div>
          </div>
        </section>
      </Stagger>

      {/* Stats */}
      <Stagger index={1}>
        <section className="flex gap-4 overflow-x-auto scrollbar-hide md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
          {statCards.map(({ label, value, change, icon: Icon }) => (
            <Card key={label} className="min-w-[200px] shrink-0 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md md:min-w-0">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold tabular-nums">{value}</p>
                  <Badge variant="secondary" className="w-fit gap-1 text-xs">
                    {change >= 0 ? (
                      <ArrowUpRight className="size-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="size-3 text-destructive" />
                    )}
                    {change >= 0 ? "+" : ""}
                    {change}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </Stagger>

      {/* Continue Learning */}
      <Stagger index={2}>
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Continue Learning</h2>
            <Link
              href="/dashboard/my-courses"
              className="flex items-center gap-1 text-sm font-medium text-primary transition-all duration-200 hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            {data.resume.length > 0 ? (
              data.resume.map((course) => {
                const pct =
                  course.durationSec > 0
                    ? Math.min(100, Math.round((course.resumeAtSeconds / course.durationSec) * 100))
                    : course.progressPct;
                const href = `/learn/${course.slug}?lecture=${encodeURIComponent(course.lectureId)}&t=${encodeURIComponent(String(course.resumeAtSeconds))}`;
                return (
                  <Card
                    key={course.lectureId}
                    className="min-w-[280px] snap-start overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg md:min-w-0"
                  >
                    <div className="relative aspect-video bg-muted">
                      {course.thumbnailUrl ? (
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="320px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <BookOpen className="size-10 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute right-2 top-2" variant="secondary">
                        {course.category}
                      </Badge>
                    </div>
                    <CardContent className="flex flex-col gap-3 p-4">
                      <p className="line-clamp-2 text-base font-semibold">{course.lectureTitle}</p>
                      <p className="text-xs text-muted-foreground">{course.title}</p>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Last watched:{" "}
                        {formatDistanceToNow(new Date(course.lastWatchedAt), { addSuffix: true })}
                      </p>
                      <Button asChild size="sm" className="w-fit transition-all duration-200">
                        <Link href={href}>
                          <Play className="size-4" data-icon="inline-start" />
                          Continue
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="w-full rounded-2xl md:col-span-3">
                <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                  <div className="text-muted-foreground">
                    <Lock className="mx-auto size-12 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No lectures in progress</p>
                  <Button asChild>
                    <Link href="/courses">Explore Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </Stagger>

      {/* Charts row */}
      <Stagger index={3}>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Learning Momentum</CardTitle>
              <CardDescription>Watch time over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Clock className="size-3" />
                  Total {data.watch7Total.toFixed(1)}h
                </Badge>
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  Avg {data.watch7Average.toFixed(1)}h/day
                </Badge>
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  {data.watchTrendPct >= 0 ? (
                    <ArrowUpRight className="size-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="size-3 text-destructive" />
                  )}
                  {data.watchTrendPct >= 0 ? "+" : ""}
                  {data.watchTrendPct}%
                </Badge>
              </div>
              <WatchHoursChart data={data.watchHours7d} averageHours={data.watch7Average} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quiz Performance</CardTitle>
              <CardDescription>Recent scores — green is pass, red is fail</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <QuizPerformanceChart
                data={data.quizPerformance.map((q) => ({
                  quiz_title: q.quizTitle,
                  percentage: q.percentage,
                  passed: q.passed,
                }))}
              />
              <Badge variant="outline">
                {data.quizResults.filter((q) => q.passed).length} of {data.quizResults.length} quizzes passed
              </Badge>
            </CardContent>
          </Card>
        </section>
      </Stagger>

      {/* Progress + Streak */}
      <Stagger index={4}>
        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]" id="overall-progress">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CourseProgressChart
                data={data.courseProgress.map((c) => ({
                  title: c.title,
                  completed: c.completed,
                  remaining: c.remaining,
                  pct: c.pct,
                }))}
                overallPct={data.overallProgressPct}
              />
              {data.courseProgress.length === 1 ? (
                <p className="text-center text-sm font-medium">
                  🎯 {data.overallProgressPct}% there — keep going!
                </p>
              ) : null}
              <div className="flex flex-col gap-3">
                {data.courseProgress.map((c, i) => (
                  <React.Fragment key={c.courseId}>
                    {i > 0 ? <Separator /> : null}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <Link
                          href={`/learn/${c.slug}`}
                          className="truncate font-medium transition-colors hover:text-primary"
                        >
                          {c.title}
                        </Link>
                        <span className="shrink-0 text-muted-foreground">{c.pct}%</span>
                      </div>
                      <Progress value={c.pct} className="h-1.5" />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Study Streak</CardTitle>
              <CardDescription>Your learning activity over the past year</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StudyStreakHeatmap
                days={data.streakDays.map((d) => ({ date: d.date, seconds: d.seconds }))}
                lecturesByDate={Object.fromEntries(
                  data.streakDays.map((d) => [d.date, d.lecturesWatched]),
                )}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">🔥 {data.currentStreak}-day streak</Badge>
                <Badge variant="outline">Longest: {data.longestStreak} days</Badge>
                <Badge variant="outline">{data.totalActiveDays} active days</Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </Stagger>

      {/* Active courses + sidebar panels */}
      <Stagger index={5}>
        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">My Active Courses</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {data.activeCourses.length > 0 ? (
                data.activeCourses.map((course) => (
                  <Card
                    key={course.enrollmentId}
                    className="overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <CardContent className="p-0">
                      <div className="relative h-36 bg-muted">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="400px"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge variant="outline">{course.subjectCode}</Badge>
                        </div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Link
                              href={`/learn/${course.slug}`}
                              className="font-semibold transition-colors hover:text-primary"
                            >
                              {course.title}
                            </Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 rounded-xl">
                            <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                            {course.rating ? (
                              <p className="mt-2 text-sm">★ {course.rating.toFixed(1)} rating</p>
                            ) : null}
                          </HoverCardContent>
                        </HoverCard>
                        <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {course.completedLectures}/{course.totalLectures} lectures
                          </span>
                          <span>{course.progressPct}%</span>
                        </div>
                        <Progress value={course.progressPct} className="h-2" />
                        {course.lastActivity ? (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(course.lastActivity), { addSuffix: true })}
                          </p>
                        ) : null}
                        <div className="flex gap-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/learn/${course.slug}`}>Go to Course</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBookmark(course.courseId)}
                            aria-label={bookmarks.has(course.courseId) ? "Remove bookmark" : "Bookmark course"}
                          >
                            <Bookmark
                              className={cn(
                                "size-4",
                                bookmarks.has(course.courseId) && "fill-primary text-primary",
                              )}
                            />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="rounded-2xl md:col-span-2">
                  <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                    <BookOpen className="size-12 text-muted-foreground opacity-40" />
                    <p className="text-sm">You haven&apos;t enrolled in any courses yet</p>
                    <Button asChild>
                      <Link href="/courses">Explore Courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Live sessions */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Upcoming Live Sessions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {data.liveSessions.length > 0 ? (
                  data.liveSessions.map((session) => {
                    const isLive = session.status === "live";
                    const formatted = session.scheduledAt
                      ? new Date(session.scheduledAt).toLocaleString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZoneName: "short",
                        })
                      : "—";
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-xl border p-3 transition-all duration-200",
                          isLive && "border-emerald-500 border-2",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={session.instructorAvatar ?? undefined} alt={session.instructorName} />
                            <AvatarFallback>{session.instructorName.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">{session.title}</p>
                              {isLive ? (
                                <Badge className="animate-pulse bg-emerald-600">LIVE</Badge>
                              ) : (
                                <span className="size-2 rounded-full bg-primary" aria-hidden />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{session.instructorName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatted}</p>
                          </div>
                        </div>
                        <Button
                          asChild={isLive}
                          size="sm"
                          disabled={pendingAction === session.id}
                          onClick={!isLive ? () => void handleReminder(session.id) : undefined}
                        >
                          {isLive ? (
                            <Link href={`/learn/${session.courseSlug}/live`}>Join</Link>
                          ) : (
                            <span className="flex items-center gap-2">
                              {pendingAction === session.id ? <Spinner /> : null}
                              Set Reminder
                            </span>
                          )}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <Calendar className="size-12 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/student/live">Browse Schedule</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificates */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Certificates</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {data.certificates.length > 0 ? (
                  data.certificates.map((cert) => (
                    <div key={cert.id} className="flex flex-col gap-3 rounded-xl border p-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Award className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{cert.courseTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Issued{" "}
                            {formatDistanceToNow(new Date(cert.issuedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <a href={cert.certUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="size-4" data-icon="inline-start" />
                            Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setShareCert({
                              title: cert.courseTitle,
                              url: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/certificates`,
                            })
                          }
                        >
                          <Share2 className="size-4" />
                          <span className="sr-only">Share certificate</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <Lock className="size-10 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      Complete a course to earn your first certificate
                    </p>
                    <Progress value={data.overallProgressPct} className="h-2 w-full" />
                    <p className="text-xs text-muted-foreground">
                      {data.overallProgressPct}% toward your next certificate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </Stagger>

      {/* Quiz results */}
      <Stagger index={6}>
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Quiz Results</h2>
            <Link
              href="/dashboard/tests"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all quizzes
            </Link>
          </div>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          className="font-medium hover:text-primary"
                          onClick={() => setQuizSort("name")}
                        >
                          Quiz Name
                        </button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="font-medium hover:text-primary"
                          onClick={() => setQuizSort("date")}
                        >
                          Date
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleQuizzes.map((q) => (
                      <TableRow
                        key={q.attemptId}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/tests/result/${q.attemptId}`)}
                      >
                        <TableCell>
                          <div className="font-medium">{q.quizTitle}</div>
                          <div className="text-xs text-muted-foreground">{q.courseTitle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{q.quizType}</Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {q.score}/{q.totalMarks}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className={cn(
                              !q.passed && "bg-destructive text-destructive-foreground",
                            )}
                          >
                            {q.passed ? <Trophy className="size-3" data-icon="inline-start" /> : null}
                            {q.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(q.submittedAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col md:hidden">
                {visibleQuizzes.map((q, i) => (
                  <Link
                    key={q.attemptId}
                    href={`/dashboard/tests/result/${q.attemptId}`}
                    className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    {i > 0 ? <Separator className="mb-2" /> : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{q.quizTitle}</p>
                        <p className="truncate text-xs text-muted-foreground">{q.courseTitle}</p>
                      </div>
                      <Badge variant={q.passed ? "default" : "destructive"}>
                        {q.percentage}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{q.quizType}</span>
                      <span>
                        {q.score}/{q.totalMarks}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              {data.quizResults.length === 0 ? (
                <div className="flex flex-col items-center gap-4 p-10 text-center">
                  <ClipboardList className="size-12 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">No quizzes taken yet</p>
                  <Button asChild>
                    <Link href="/dashboard/tests">Take a Quiz</Link>
                  </Button>
                </div>
              ) : null}
              {data.quizResults.length > 5 ? (
                <div className="border-t p-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllQuizzes((v) => !v)}
                  >
                    {showAllQuizzes ? "Show less" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </Stagger>

      <ScrollToTop />

      <Dialog open={!!shareCert} onOpenChange={() => setShareCert(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share Certificate</DialogTitle>
            <DialogDescription>{shareCert?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={shareCert?.url ?? ""}
                className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm"
              />
              <Button size="sm" onClick={() => shareCert && copyShareLink(shareCert.url)}>
                Copy
              </Button>
            </div>
            <Button asChild variant="outline">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareCert?.url ?? "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on LinkedIn
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
