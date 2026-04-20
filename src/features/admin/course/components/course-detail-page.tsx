"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
  IconCheck,
  IconClock,
  IconFileText,
  IconLayersIntersect,
  IconMaximize,
  IconPencil,
  IconPlayerPlay,
  IconSchool,
  IconSettings,
  IconSparkles,
  IconUsers,
  IconVolume,
  IconAlertTriangle,
  IconPlayerPause,
  IconChevronRight,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { adminApi } from "@/features/admin/lib/admin-api";
import type {
  AdminCoursePreview,
  AdminCoursePreviewLecture,
  AdminCoursePreviewSection,
} from "@/features/admin/course/types/course-preview";

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseDetailPageProps = {
  courseIdentifier: string;
};

type FlatLecture = AdminCoursePreviewLecture & {
  sectionId: string;
  sectionTitle: string;
  sectionPosition: number;
  globalIndex: number;
};

// ─── Pure utilities ───────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatLevel(level: string): string {
  const map: Record<string, string> = {
    knowledge: "Knowledge",
    skills: "Skills",
    professional: "Professional",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return map[level] ?? level ?? "All levels";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getSectionDuration(section: AdminCoursePreviewSection): number {
  return section.lectures.reduce((t, l) => t + l.durationSec, 0);
}

function flattenLectures(course: AdminCoursePreview): FlatLecture[] {
  let globalIndex = 0;
  return course.sections.flatMap((section) =>
    section.lectures.map((lecture) => ({
      ...lecture,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionPosition: section.position,
      globalIndex: globalIndex++,
    })),
  );
}

function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const searchId = url.searchParams.get("v");
      if (searchId) return searchId;

      const segments = url.pathname.split("/").filter(Boolean);
      const knownPrefixes = ["embed", "shorts", "live"];
      if (segments.length >= 2 && knownPrefixes.includes(segments[0])) {
        return segments[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function buildYoutubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    iv_load_policy: "3",
    loop: "1",
    playlist: videoId,
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-360 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-125 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Video player area ────────────────────────────────────────────────────────

function VideoPlayer({
  course,
  activeLecture,
  progressValue,
  watchedSeconds,
  totalDuration,
  isPlaying,
  onPlay,
  onNext,
}: {
  course: AdminCoursePreview;
  activeLecture: FlatLecture | null;
  progressValue: number;
  watchedSeconds: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onNext: () => void;
}) {
  const activeVideoId = React.useMemo(
    () => extractYoutubeVideoId(activeLecture?.videoUrl ?? ""),
    [activeLecture?.videoUrl],
  );

  const embedSrc = React.useMemo(
    () => (activeVideoId ? buildYoutubeEmbedUrl(activeVideoId) : null),
    [activeVideoId],
  );

  const bgStyle = course.thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(17,24,39,0.55)), url(${course.thumbnailUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Player viewport */}
      <div className="relative aspect-video" style={bgStyle}>
        {embedSrc ? (
          <>
            <div className="absolute inset-0 overflow-hidden bg-black">
              <iframe
                src={embedSrc}
                title={
                  activeLecture
                    ? `${activeLecture.title} video preview`
                    : `${course.name} video preview`
                }
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="pointer-events-none absolute -left-[1%] -top-16 h-[calc(100%+128px)] w-[102%]"
              />
            </div>

            {/* Hide most native YouTube chrome so this section stays fully custom */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/85 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-black/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-black/80 to-transparent" />
          </>
        ) : (
          <>
            {!course.thumbnailUrl && (
              <div className="absolute inset-0 bg-linear-to-br from-muted/70 via-background to-muted/40" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

        {/* Top badges */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm"
          >
            {formatLevel(course.level)}
          </Badge>
          {activeLecture?.isPreview && (
            <Badge
              variant="secondary"
              className="border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm"
            >
              Free preview
            </Badge>
          )}
          {embedSrc && (
            <Badge
              variant="secondary"
              className="border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm"
            >
              Custom iframe player
            </Badge>
          )}
        </div>

        {/* Top-right controls */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
                >
                  <IconSettings className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
                >
                  <IconMaximize className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Centre play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="icon"
            className="size-16 rounded-full border border-border/60 bg-background/95 shadow-lg transition-transform hover:scale-105 hover:bg-background"
            onClick={onPlay}
          >
            {isPlaying ? (
              <IconPlayerPause className="size-7 text-foreground" />
            ) : (
              <IconPlayerPlay className="size-7 text-foreground" />
            )}
          </Button>
        </div>

        {/* Bottom transport bar */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/90 to-transparent p-4">
          {/* Active lecture title */}
          {activeLecture && (
            <p className="mb-3 line-clamp-1 text-sm font-medium text-foreground">
              {activeLecture.sectionTitle} · {activeLecture.title}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-lg text-foreground hover:bg-muted"
              onClick={onPlay}
            >
              {isPlaying ? (
                <IconPlayerPause className="size-4" />
              ) : (
                <IconPlayerPlay className="size-4" />
              )}
            </Button>

            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {formatTimestamp(watchedSeconds)}
            </span>

            {/* Scrubber */}
            <div className="relative flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-300"
                  style={{ width: `${Math.max(progressValue, 0)}%` }}
                />
              </div>
            </div>

            <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTimestamp(totalDuration)}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-lg text-foreground hover:bg-muted"
            >
              <IconVolume className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2 text-xs text-foreground hover:bg-muted"
              onClick={onNext}
            >
              Next
              <IconChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Curriculum sidebar item ──────────────────────────────────────────────────

function LectureItem({
  lecture,
  isActive,
  isCompleted,
  onClick,
}: {
  lecture: FlatLecture;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        isActive
          ? "border-primary/30 bg-primary/10"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
    >
      {/* Index / completion indicator */}
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums transition-colors",
          isCompleted
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
            : isActive
              ? "border-primary/40 bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground",
        )}
      >
        {isCompleted ? (
          <IconCheck className="h-3 w-3" />
        ) : (
          <span>{lecture.position + 1}</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-2 text-sm leading-5",
            isActive ? "font-medium text-foreground" : "text-foreground/80",
          )}
        >
          {lecture.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDuration(lecture.durationSec)}
          </span>
          {lecture.resources.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <IconFileText className="h-3 w-3" />
              {lecture.resources.length}
            </span>
          )}
          {lecture.isPreview && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              Preview
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CourseDetailPage({ courseIdentifier }: CourseDetailPageProps) {
  const [activeLectureIndex, setActiveLectureIndex] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const curriculumRef = React.useRef<HTMLDivElement>(null);

  // ── Data ───────────────────────────────────────────────────────────────────

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-course-detail", courseIdentifier],
    queryFn: () => adminApi.getCoursePreview(courseIdentifier),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["admin-enrollments-all"],
    queryFn: adminApi.getEnrollments,
    enabled: Boolean(data?.course),
  });

  const course = data?.course;

  // ── Flatten lectures once per course ──────────────────────────────────────

  const flatLectures = React.useMemo(
    () => (course ? flattenLectures(course) : []),
    [course],
  );

  // Reset state when course changes
  React.useEffect(() => {
    if (!course) return;
    setActiveLectureIndex(0);
    setIsPlaying(false);
    setSaved(false);
  }, [course]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const activeLecture = flatLectures[activeLectureIndex] ?? null;

  const activeSection = React.useMemo(
    () =>
      course?.sections.find(
        (section: AdminCoursePreviewSection) =>
          section.id === activeLecture?.sectionId,
      ) ??
      course?.sections[0] ??
      null,
    [course, activeLecture],
  );

  const totalLectures = flatLectures.length;

  // "Completed" = all lectures strictly before the active one
  const completedCount = activeLectureIndex;

  const progressPct =
    totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const totalDurationSec = course?.stats.totalDurationSec ?? 0;

  const watchedSec = React.useMemo(
    () =>
      flatLectures
        .slice(0, activeLectureIndex)
        .reduce((t, l) => t + l.durationSec, 0),
    [flatLectures, activeLectureIndex],
  );

  const enrollmentCount = React.useMemo(() => {
    if (!course) return 0;
    return (enrollmentsData?.enrollments ?? []).filter(
      (e) => e.course === course.name,
    ).length;
  }, [course, enrollmentsData]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const goToNext = React.useCallback(() => {
    setActiveLectureIndex((prev) =>
      Math.min(prev + 1, flatLectures.length - 1),
    );
    setIsPlaying(true);
    curriculumRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [flatLectures.length]);

  const handlePlay = React.useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // ── Loading / error ────────────────────────────────────────────────────────

  if (isLoading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Course unavailable</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "This course could not be loaded. Try again later."}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/course">
                <IconArrowLeft className="size-4" />
                Back to courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-360 px-4 py-6 lg:px-6">
          <div className="flex flex-col gap-6">
            {/* ── Top navigation bar ──────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href="/admin/course">
                  <IconArrowLeft className="size-4" />
                  Back to courses
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {course.slug}
                </Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/course/${course.slug}/edit`}>
                    <IconPencil className="size-4" />
                    Edit course
                  </Link>
                </Button>
              </div>
            </div>

            {/* ── Main grid ───────────────────────────────────────────────── */}
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              {/* Left column */}
              <div className="min-w-0 space-y-6">
                {/* Video player */}
                <VideoPlayer
                  course={course}
                  activeLecture={activeLecture}
                  progressValue={progressPct}
                  watchedSeconds={watchedSec}
                  totalDuration={totalDurationSec}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onNext={goToNext}
                />

                {/* Course info */}
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="capitalize">
                            {course.status}
                          </Badge>
                          <Badge variant="outline">
                            {formatLevel(course.level)}
                          </Badge>
                          <Badge variant="outline">
                            {course.sections.length} sections
                          </Badge>
                          <Badge variant="outline">
                            {totalLectures} lectures
                          </Badge>
                          <Badge variant="outline">
                            {formatDuration(totalDurationSec)}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                          {course.name}
                        </h1>

                        {/* Description */}
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {course.description?.trim() ||
                            "A structured course with sections, lectures, and downloadable resources."}
                        </p>

                        {/* Meta chips */}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <IconSchool className="size-4" />
                            {course.instructor.name}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <IconClock className="size-4" />
                            {formatDuration(totalDurationSec)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <IconSparkles className="size-4" />
                            {formatLevel(course.level)}
                          </span>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                        <Button className="w-full" onClick={goToNext}>
                          <IconPlayerPlay className="size-4" />
                          Continue
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full",
                            saved &&
                              "border-primary/40 bg-primary/5 text-primary",
                          )}
                          onClick={() => setSaved((p) => !p)}
                        >
                          {saved ? (
                            <IconBookmarkFilled className="size-4" />
                          ) : (
                            <IconBookmark className="size-4" />
                          )}
                          {saved ? "Saved" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricCard
                    icon={IconUsers}
                    label="Students"
                    value={enrollmentCount.toLocaleString()}
                    sub="enrolled"
                  />
                  <MetricCard
                    icon={IconClock}
                    label="Duration"
                    value={formatDuration(totalDurationSec)}
                    sub="total content"
                  />
                  <MetricCard
                    icon={IconLayersIntersect}
                    label="Lectures"
                    value={String(totalLectures)}
                    sub="across sections"
                  />
                  <MetricCard
                    icon={IconFileText}
                    label="Resources"
                    value={String(course.stats.totalResources)}
                    sub="downloadable files"
                  />
                </div>

                {/* Instructor card */}
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Instructor
                        </p>
                        <CardTitle className="mt-1 text-xl">
                          {course.instructor.name}
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                          {course.instructor.email}
                        </CardDescription>
                      </div>
                      <Avatar className="size-14 rounded-xl border">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-base font-semibold text-primary">
                          {getInitials(course.instructor.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: "Role",
                          value: "Lead instructor",
                          icon: IconSchool,
                        },
                        {
                          label: "Sections",
                          value: String(course.sections.length),
                          icon: IconLayersIntersect,
                        },
                        {
                          label: "Level",
                          value: formatLevel(course.level),
                          icon: IconSparkles,
                        },
                      ].map(({ label, value, icon: Icon }) => (
                        <div
                          key={label}
                          className="rounded-lg border bg-muted/30 p-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {label}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column — sticky sidebar */}
              <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                {/* Progress card */}
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Your Progress</CardTitle>
                    <CardDescription>
                      {completedCount} of {totalLectures} lectures completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Progress value={progressPct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progressPct}% complete</span>
                        {activeSection && (
                          <span className="line-clamp-1 max-w-40 text-right">
                            {activeSection.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button className="w-full" onClick={goToNext}>
                      <IconPlayerPlay className="h-4 w-4" />
                      Continue learning
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full",
                        saved && "border-primary/40 bg-primary/5 text-primary",
                      )}
                      onClick={() => setSaved((p) => !p)}
                    >
                      {saved ? (
                        <IconBookmarkFilled className="size-4" />
                      ) : (
                        <IconBookmark className="size-4" />
                      )}
                      {saved ? "Saved for later" : "Save for later"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Curriculum list */}
                <Card
                  ref={curriculumRef}
                  className="rounded-2xl border-border/60 shadow-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Curriculum</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {totalLectures} lectures
                      </Badge>
                    </div>
                    <CardDescription>
                      {course.sections.length} sections ·{" "}
                      {formatDuration(totalDurationSec)} total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-130">
                      <div className="space-y-px px-4 pb-4">
                        {course.sections.map(
                          (section: AdminCoursePreviewSection) => {
                            const sectionStartIndex = flatLectures.findIndex(
                              (lecture: FlatLecture) =>
                                lecture.sectionId === section.id,
                            );

                            return (
                              <div key={section.id}>
                                {/* Section header */}
                                <div className="sticky top-0 z-10 bg-card py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        Section {section.position + 1}
                                      </p>
                                      <p className="mt-0.5 text-sm font-semibold leading-tight">
                                        {section.title}
                                      </p>
                                    </div>
                                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                      {formatDuration(
                                        getSectionDuration(section),
                                      )}
                                    </span>
                                  </div>
                                  <Separator className="mt-2" />
                                </div>

                                {/* Lectures */}
                                <div className="space-y-0.5 pt-1 pb-3">
                                  {section.lectures.map(
                                    (
                                      lecture: AdminCoursePreviewLecture,
                                      idx: number,
                                    ) => {
                                      const globalIdx =
                                        sectionStartIndex >= 0
                                          ? sectionStartIndex + idx
                                          : idx;
                                      return (
                                        <LectureItem
                                          key={lecture.id}
                                          lecture={{
                                            ...lecture,
                                            sectionId: section.id,
                                            sectionTitle: section.title,
                                            sectionPosition: section.position,
                                            globalIndex: globalIdx,
                                          }}
                                          isActive={
                                            globalIdx === activeLectureIndex
                                          }
                                          isCompleted={
                                            globalIdx < completedCount
                                          }
                                          onClick={() => {
                                            setActiveLectureIndex(globalIdx);
                                            setIsPlaying(true);
                                          }}
                                        />
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
