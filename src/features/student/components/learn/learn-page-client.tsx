"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
} from "@tabler/icons-react";
import {
  useCourseContent,
  useLectureProgress,
  useUpdateProgress,
} from "@/features/student/hooks/use-learn";
import { VideoPlayer, VideoPlayerSkeleton } from "./video-player";
import {
  CurriculumSidebar,
  CurriculumSidebarSkeleton,
} from "./curriculum-sidebar";
import { BottomTabs } from "./bottom-tabs";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import type {
  FlatLecture,
  LectureWithResources,
} from "@/features/student/types/learn";
import { formatDuration } from "@/lib/supabase/queries";

interface LearnPageClientProps {
  courseId: string;
  userId: string;
  navbarUser: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  initialLectureId?: string | null;
  initialTimeSeconds?: number | null;
}

export function LearnPageClient({
  courseId,
  userId,
  navbarUser,
  initialLectureId,
  initialTimeSeconds,
}: LearnPageClientProps) {
  // ─── Data fetching ─────────────────────────────────────────────
  const { data: course, isLoading: courseLoading } = useCourseContent(courseId);

  // Build a flat, ordered list of all lectures
  const flatLectures: FlatLecture[] = useMemo(() => {
    if (!course?.chapters) return [];
    const list: FlatLecture[] = [];
    course.chapters.forEach((chapter, chapterIndex) => {
      chapter.lectures.forEach((lecture, lectureIndex) => {
        list.push({
          chapterIndex,
          lectureIndex,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          lecture,
        });
      });
    });
    return list;
  }, [course]);

  // All lecture IDs for progress fetching
  const allLectureIds = useMemo(
    () => flatLectures.map((fl) => fl.lecture.id),
    [flatLectures]
  );

  const { progressMap } = useLectureProgress(userId, allLectureIds);

  const updateProgress = useUpdateProgress(userId);

  // ─── Current lecture state ─────────────────────────────────────
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);

  const defaultLectureId = useMemo(() => {
    if (flatLectures.length === 0) return null;

    const requested = initialLectureId
      ? flatLectures.find((fl) => fl.lecture.id === initialLectureId)
      : null;
    if (requested) return requested.lecture.id;

    const firstIncomplete = flatLectures.find((fl) => {
      const p = progressMap.get(fl.lecture.id);
      return !p?.is_completed;
    });

    return firstIncomplete?.lecture.id ?? flatLectures[0].lecture.id;
  }, [flatLectures, progressMap, initialLectureId]);

  const activeLectureId = currentLectureId ?? defaultLectureId;

  // Current flat lecture object
  const currentFlatIndex = useMemo(
    () => flatLectures.findIndex((fl) => fl.lecture.id === activeLectureId),
    [flatLectures, activeLectureId]
  );

  const currentFlat = flatLectures[currentFlatIndex] ?? null;
  const currentLecture = currentFlat?.lecture ?? null;

  const isCurrentCompleted =
    activeLectureId ? progressMap.get(activeLectureId)?.is_completed ?? false : false;

  // ─── Navigation handlers ──────────────────────────────────────
  const goToLecture = useCallback(
    (lecture: LectureWithResources) => {
      setCurrentLectureId(lecture.id);
      window.scrollTo({ top: 0, behavior: "smooth" });

      const url = new URL(window.location.href);
      url.searchParams.set("lecture", lecture.id);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  const handlePrevious = useMemo(
    () =>
      currentFlatIndex > 0
        ? () => goToLecture(flatLectures[currentFlatIndex - 1].lecture)
        : null,
    [currentFlatIndex, flatLectures, goToLecture]
  );

  const handleNext = useMemo(
    () =>
      currentFlatIndex < flatLectures.length - 1
        ? () => goToLecture(flatLectures[currentFlatIndex + 1].lecture)
        : null,
    [currentFlatIndex, flatLectures, goToLecture]
  );

  // ─── Progress tracking (real-time via onTimeUpdate) ────────────
  const lastSavedTimeRef = useRef(0);

  // Reset saved time when lecture changes
  useEffect(() => {
    lastSavedTimeRef.current = 0;
  }, [activeLectureId]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!activeLectureId) return;

      // Save progress every 10 seconds of change
      const timeDelta = Math.abs(currentTime - lastSavedTimeRef.current);
      if (timeDelta >= 10) {
        lastSavedTimeRef.current = currentTime;
        // Mark as complete if there is 1 minute (60 seconds) or less remaining
        const isNearEnd = duration > 0 && (duration - currentTime <= 60);

        updateProgress.mutate({
          lectureId: activeLectureId,
          isCompleted: isNearEnd,
          watchedSeconds: Math.floor(currentTime),
          resumeAtSeconds: Math.floor(currentTime),
        });
      }
    },
    [activeLectureId, updateProgress]
  );

  // ─── Progress handlers ────────────────────────────────────────
  const handleMarkComplete = useCallback(() => {
    if (!activeLectureId) return;
    updateProgress.mutate(
      { lectureId: activeLectureId, isCompleted: true },
      {
        onSuccess: () => toast.success("Lecture marked as complete"),
        onError: () => toast.error("Failed to mark lecture complete"),
      }
    );
  }, [activeLectureId, updateProgress]);

  const handleVideoEnded = useCallback(() => {
    if (!activeLectureId || isCurrentCompleted) {
      if (handleNext) handleNext();
      return;
    }
    updateProgress.mutate(
      { lectureId: activeLectureId, isCompleted: true },
      {
        onSuccess: () => {
          toast.success("Lecture completed!");
          if (handleNext) {
            setTimeout(() => handleNext(), 800);
          }
        },
      }
    );
  }, [activeLectureId, isCurrentCompleted, updateProgress, handleNext]);

  // ─── Computed values ──────────────────────────────────────────
  const completedCount = useMemo(() => {
    let count = 0;
    for (const id of allLectureIds) {
      if (progressMap.get(id)?.is_completed) count++;
    }
    return count;
  }, [allLectureIds, progressMap]);

  // ─── Loading state ────────────────────────────────────────────
  if (courseLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <div className="flex-1">
          <VideoPlayerSkeleton />
        </div>
        <div className="w-full lg:w-[360px]">
          <CurriculumSidebarSkeleton />
        </div>
      </div>
    );
  }

  if (!course || flatLectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">No lectures available</p>
        <p className="text-sm text-muted-foreground mt-1">
          This course does not have any lectures yet.
        </p>
      </div>
    );
  }

  // ─── Sidebar content (shared between desktop & mobile sheet) ──
  const sidebarContent = (
    <CurriculumSidebar
      chapters={course.chapters}
      currentLectureId={activeLectureId}
      progressMap={progressMap}
      onSelectLecture={goToLecture}
      totalLectures={flatLectures.length}
      completedCount={completedCount}
    />
  );

  return (
    <div className="flex w-full flex-col bg-muted/20">
      <DashboardNavbar user={navbarUser} />

      <div className="flex w-full flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
        {/* ─── Main content area ─────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-0">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-4 lg:hidden">
              <h1 className="truncate text-sm font-semibold">{course.title}</h1>
              <Badge variant="secondary" className="text-[11px]">
                {completedCount}/{flatLectures.length} completed
              </Badge>
            </div>

            {/* Video Player */}
            <div className=" px-0 py-0 sm:px-4 sm:pt-4 lg:px-8 lg:pt-6">
              <VideoPlayer
                lecture={currentLecture}
                isCompleted={isCurrentCompleted}
                isMarkingComplete={updateProgress.isPending}
                onMarkComplete={handleMarkComplete}
                onVideoEnded={handleVideoEnded}
                onPrevious={handlePrevious}
                onNext={handleNext}
                sectionTitle={currentFlat?.chapterTitle ?? ""}
                onTimeUpdate={handleTimeUpdate}
                initialTimeSeconds={activeLectureId === initialLectureId ? (initialTimeSeconds ?? null) : null}
              />
            </div>

            {/* Lecture info + controls below player */}
            <div className="flex flex-col gap-4 bg-background px-3 py-4 sm:px-4 lg:px-8 lg:py-6">
              {/* Section + title */}
              {currentLecture && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {currentFlat?.chapterTitle}
                  </p>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-base font-semibold leading-tight sm:text-lg">
                      {currentLecture.title}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentLecture.duration_sec > 0 && (
                        <Badge variant="secondary">
                          {formatDuration(currentLecture.duration_sec)}
                        </Badge>
                      )}
                      {isCurrentCompleted && (
                        <Badge variant="default" className="bg-emerald-600 text-white">
                          <IconCheck data-icon="inline-start" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {currentLecture.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                      {currentLecture.description}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation + Mark Complete */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!handlePrevious}
                    onClick={handlePrevious ?? undefined}
                  >
                    <IconChevronLeft data-icon="inline-start" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!handleNext}
                    onClick={handleNext ?? undefined}
                  >
                    Next
                    <IconChevronRight data-icon="inline-end" />
                  </Button>
                </div>

                {!isCurrentCompleted && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[150px]"
                    onClick={handleMarkComplete}
                    disabled={updateProgress.isPending}
                  >
                    <IconCheck data-icon="inline-start" />
                    {updateProgress.isPending ? "Marking..." : "Mark as Complete"}
                  </Button>
                )}
              </div>

              <Separator />

              {/* Bottom tabs */}
              <BottomTabs
                userId={userId}
                lectureId={activeLectureId}
                resources={currentLecture?.resources ?? []}
                lectureDescription={currentLecture?.description ?? null}
              />
            </div>

            <div className="border-t border-border bg-background lg:hidden">
              <div className="px-3 py-3 sm:px-4">
                <p className="text-sm font-semibold">Course Content</p>
                <p className="text-xs text-muted-foreground">
                  Continue from any lecture
                </p>
              </div>
              <div className="h-[58vh] min-h-[360px] border-t border-border">
                {sidebarContent}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Desktop sidebar ───────────────────────────────────── */}
        <aside className="hidden lg:flex lg:w-[420px] lg:shrink-0 lg:border-l lg:border-border lg:bg-background xl:w-[460px]">
          {sidebarContent}
        </aside>
      </div>
    </div>
  );
}
