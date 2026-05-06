"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  IconMenu2,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
} from "@tabler/icons-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import type {
  FlatLecture,
  LectureWithResources,
} from "@/features/student/types/learn";
import { formatDuration } from "@/lib/supabase/queries";

interface LearnPageClientProps {
  courseId: string;
  userId: string;
  initialLectureId?: string | null;
  initialTimeSeconds?: number | null;
}

export function LearnPageClient({
  courseId,
  userId,
  initialLectureId,
  initialTimeSeconds,
}: LearnPageClientProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const {
    progressMap,
    isLoading: progressLoading,
  } = useLectureProgress(userId, allLectureIds);

  const updateProgress = useUpdateProgress(userId);

  // ─── Current lecture state ─────────────────────────────────────
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);

  // Set initial lecture once course loads
  useEffect(() => {
    if (flatLectures.length > 0 && !currentLectureId) {
      const requested = initialLectureId
        ? flatLectures.find((fl) => fl.lecture.id === initialLectureId)
        : null;

      if (requested) {
        setCurrentLectureId(requested.lecture.id);
        return;
      }

      const firstIncomplete = flatLectures.find((fl) => {
        const p = progressMap.get(fl.lecture.id);
        return !p?.is_completed;
      });
      setCurrentLectureId(firstIncomplete?.lecture.id ?? flatLectures[0].lecture.id);
    }
  }, [flatLectures, currentLectureId, progressMap, initialLectureId]);

  // Current flat lecture object
  const currentFlatIndex = useMemo(
    () => flatLectures.findIndex((fl) => fl.lecture.id === currentLectureId),
    [flatLectures, currentLectureId]
  );

  const currentFlat = flatLectures[currentFlatIndex] ?? null;
  const currentLecture = currentFlat?.lecture ?? null;

  const isCurrentCompleted =
    currentLectureId ? progressMap.get(currentLectureId)?.is_completed ?? false : false;

  // ─── Navigation handlers ──────────────────────────────────────
  const goToLecture = useCallback(
    (lecture: LectureWithResources) => {
      setCurrentLectureId(lecture.id);
      if (isMobile) setSheetOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });

      const url = new URL(window.location.href);
      url.searchParams.set("lecture", lecture.id);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.toString());
    },
    [isMobile]
  );

  const handlePrevious = currentFlatIndex > 0
    ? () => goToLecture(flatLectures[currentFlatIndex - 1].lecture)
    : null;

  const handleNext = currentFlatIndex < flatLectures.length - 1
    ? () => goToLecture(flatLectures[currentFlatIndex + 1].lecture)
    : null;

  // ─── Progress tracking (real-time via onTimeUpdate) ────────────
  const lastSavedTimeRef = useRef(0);

  // Reset saved time when lecture changes
  useEffect(() => {
    lastSavedTimeRef.current = 0;
  }, [currentLectureId]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!currentLectureId) return;

      // Save progress every 10 seconds of change
      const timeDelta = Math.abs(currentTime - lastSavedTimeRef.current);
      if (timeDelta >= 10) {
        lastSavedTimeRef.current = currentTime;
        // Mark as complete if there is 1 minute (60 seconds) or less remaining
        const isNearEnd = duration > 0 && (duration - currentTime <= 60);

        updateProgress.mutate({
          lectureId: currentLectureId,
          isCompleted: isNearEnd,
          watchedSeconds: Math.floor(currentTime),
          resumeAtSeconds: Math.floor(currentTime),
        });
      }
    },
    [currentLectureId, updateProgress]
  );

  // ─── Progress handlers ────────────────────────────────────────
  const handleMarkComplete = useCallback(() => {
    if (!currentLectureId) return;
    updateProgress.mutate(
      { lectureId: currentLectureId, isCompleted: true },
      {
        onSuccess: () => toast.success("Lecture marked as complete"),
        onError: () => toast.error("Failed to mark lecture complete"),
      }
    );
  }, [currentLectureId, updateProgress]);

  const handleVideoEnded = useCallback(() => {
    if (!currentLectureId || isCurrentCompleted) {
      if (handleNext) handleNext();
      return;
    }
    updateProgress.mutate(
      { lectureId: currentLectureId, isCompleted: true },
      {
        onSuccess: () => {
          toast.success("Lecture completed!");
          if (handleNext) {
            setTimeout(() => handleNext(), 800);
          }
        },
      }
    );
  }, [currentLectureId, isCurrentCompleted, updateProgress, handleNext]);

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
      currentLectureId={currentLectureId}
      progressMap={progressMap}
      onSelectLecture={goToLecture}
      totalLectures={flatLectures.length}
      completedCount={completedCount}
    />
  );

  return (
    <div className="flex w-full flex-col bg-background lg:h-[calc(100vh-65px)] lg:flex-row">
      {/* ─── Main content area ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-0">
          {/* Mobile curriculum trigger */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-4 lg:hidden">
            <h1 className="truncate text-sm font-semibold">
              {course.title}
            </h1>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconMenu2 data-icon="inline-start" />
                  Curriculum
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-screen max-w-none p-0">
                <SheetTitle className="sr-only">Course Curriculum</SheetTitle>
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>

          {/* Video Player */}
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
            initialTimeSeconds={currentLectureId === initialLectureId ? (initialTimeSeconds ?? null) : null}
          />

          {/* Lecture info + controls below player */}
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4 lg:px-8">
            {/* Section + title */}
            {currentLecture && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
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
                  className="w-full sm:w-auto"
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
              lectureId={currentLectureId}
              resources={currentLecture?.resources ?? []}
              lectureDescription={currentLecture?.description ?? null}
            />
          </div>
        </div>
      </div>

      {/* ─── Desktop sidebar ───────────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[420px] lg:shrink-0 lg:border-l lg:border-border xl:w-[460px]">
        {sidebarContent}
      </aside>
    </div>
  );
}
