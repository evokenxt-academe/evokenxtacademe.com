"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconList,
  IconLoader2,
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
import { CourseLiveBanner } from "./course-live-banner";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import type {
  FlatLecture,
  LectureWithResources,
} from "@/features/student/types/learn";
import { formatDuration } from "@/lib/supabase/queries";

interface LearnPageClientProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
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
  courseSlug,
  courseTitle,
  userId,
  navbarUser,
  initialLectureId,
  initialTimeSeconds,
}: LearnPageClientProps) {
  const { data: course, isLoading: courseLoading } = useCourseContent(courseId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const allLectureIds = useMemo(
    () => flatLectures.map((fl) => fl.lecture.id),
    [flatLectures],
  );

  const { progressMap } = useLectureProgress(userId, allLectureIds);
  const updateProgress = useUpdateProgress(userId);

  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const currentFlatIndex = useMemo(
    () => flatLectures.findIndex((fl) => fl.lecture.id === activeLectureId),
    [flatLectures, activeLectureId],
  );

  const currentFlat = flatLectures[currentFlatIndex] ?? null;
  const currentLecture = currentFlat?.lecture ?? null;

  const isCurrentCompleted = activeLectureId
    ? (progressMap.get(activeLectureId)?.is_completed ?? false)
    : false;

  const goToLecture = useCallback((lecture: LectureWithResources) => {
    setCurrentLectureId(lecture.id);
    setIsMobileSidebarOpen(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    const url = new URL(window.location.href);
    url.searchParams.set("lecture", lecture.id);
    url.searchParams.delete("t");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handlePrevious = useMemo(
    () =>
      currentFlatIndex > 0
        ? () => goToLecture(flatLectures[currentFlatIndex - 1].lecture)
        : null,
    [currentFlatIndex, flatLectures, goToLecture],
  );

  const handleNext = useMemo(
    () =>
      currentFlatIndex < flatLectures.length - 1
        ? () => goToLecture(flatLectures[currentFlatIndex + 1].lecture)
        : null,
    [currentFlatIndex, flatLectures, goToLecture],
  );

  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    lastSavedTimeRef.current = 0;
  }, [activeLectureId]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!activeLectureId) return;

      const timeDelta = Math.abs(currentTime - lastSavedTimeRef.current);
      if (timeDelta >= 10) {
        lastSavedTimeRef.current = currentTime;
        const isNearEnd = duration > 0 && duration - currentTime <= 60;

        updateProgress.mutate({
          lectureId: activeLectureId,
          isCompleted: isNearEnd,
          watchedSeconds: Math.floor(currentTime),
          resumeAtSeconds: Math.floor(currentTime),
        });
      }
    },
    [activeLectureId, updateProgress],
  );

  const handleMarkComplete = useCallback(() => {
    if (!activeLectureId) return;
    updateProgress.mutate(
      { lectureId: activeLectureId, isCompleted: true },
      {
        onSuccess: () => toast.success("Lecture marked as complete"),
        onError: () => toast.error("Failed to mark lecture complete"),
      },
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
      },
    );
  }, [activeLectureId, isCurrentCompleted, updateProgress, handleNext]);

  const completedCount = useMemo(() => {
    let count = 0;
    for (const id of allLectureIds) {
      if (progressMap.get(id)?.is_completed) count++;
    }
    return count;
  }, [allLectureIds, progressMap]);

  if (courseLoading && !course) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:flex-row lg:p-6 bg-background min-h-screen">
        <div className="flex-1">
          <VideoPlayerSkeleton />
        </div>
        <div className="w-full lg:w-[360px] xl:w-[380px]">
          <CurriculumSidebarSkeleton />
        </div>
      </div>
    );
  }

  if (!course || flatLectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-background min-h-screen px-4">
        <p className="text-lg font-medium text-foreground">No lectures available</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This course does not have any lectures yet.
        </p>
      </div>
    );
  }

  const sidebarContent = (
    <CurriculumSidebar
      courseId={courseId}
      courseSlug={courseSlug}
      chapters={course.chapters}
      currentLectureId={activeLectureId}
      progressMap={progressMap}
      onSelectLecture={goToLecture}
      totalLectures={flatLectures.length}
      completedCount={completedCount}
    />
  );

  const displayTitle = course.title || courseTitle;

  return (
    <div className="flex w-full flex-col bg-background">
      <DashboardNavbar user={navbarUser} minimal={true} backUrl="/dashboard" />
      <CourseLiveBanner courseId={courseId} courseSlug={courseSlug} />

      <div className="flex w-full flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
        <div ref={scrollContainerRef} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          
          {/* Unified Title Bar */}
          <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xs sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-foreground sm:text-base sm:truncate">{displayTitle}</h1>
                <p className="hidden sm:block text-[11px] text-muted-foreground/80 mt-0.5">
                  LMS Learning Studio
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                <Badge variant="outline" className="text-xs font-mono font-medium tabular-nums py-0.5 bg-muted/40">
                  {completedCount} of {flatLectures.length} completed
                </Badge>
                
                {/* Mobile Curriculum Trigger Sheet */}
                <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-8 text-xs font-medium">
                      <IconList className="mr-1.5 size-3.5" />
                      Curriculum
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col h-full">
                    <SheetHeader className="px-4 py-3 border-b shrink-0">
                      <SheetTitle className="text-sm font-semibold">Course Curriculum</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden">
                      {sidebarContent}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:gap-0">
            {/* Video container */}
            <div className="w-full px-0 py-0 sm:p-4 lg:p-6">
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
                userId={userId}
                initialTimeSeconds={
                  activeLectureId === initialLectureId
                    ? (initialTimeSeconds ?? null)
                    : null
                }
              />
            </div>

            <div className="flex flex-col gap-4 bg-background px-4 pb-6 sm:px-6 lg:px-6">
              {/* Refined Lecture Metadata & Action Row */}
              {currentLecture && (
                <div className="flex flex-col gap-2 bg-muted/[0.02] border border-border/60 rounded-xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{currentFlat?.chapterTitle}</span>
                    <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
                    <span className="text-primary font-semibold">Lecture {currentFlatIndex + 1}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <h2 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
                        {currentLecture.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {currentLecture.duration_sec > 0 && (
                          <span className="flex items-center gap-1 font-mono text-muted-foreground/90 bg-muted/40 px-2 py-0.5 rounded-md">
                            {formatDuration(currentLecture.duration_sec)}
                          </span>
                        )}
                        {isCurrentCompleted && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/10">
                            <IconCheck className="size-3.5" stroke={3} />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Integrated controls */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-initial h-9 text-xs font-medium"
                          disabled={!handlePrevious}
                          onClick={handlePrevious ?? undefined}
                        >
                          <IconChevronLeft className="mr-1 size-3.5" stroke={2} />
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-initial h-9 text-xs font-medium"
                          disabled={!handleNext}
                          onClick={handleNext ?? undefined}
                        >
                          Next
                          <IconChevronRight className="ml-1 size-3.5" stroke={2} />
                        </Button>
                      </div>

                      {!isCurrentCompleted ? (
                        <Button
                          size="sm"
                          className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
                          onClick={handleMarkComplete}
                          disabled={updateProgress.isPending}
                        >
                          {updateProgress.isPending ? (
                            <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                          ) : (
                            <IconCheck className="mr-1.5 size-3.5" stroke={2.5} />
                          )}
                          {updateProgress.isPending ? "Saving..." : "Mark Complete"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full sm:w-auto h-9 text-xs font-medium border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                        >
                          <IconCheck className="mr-1.5 size-3.5" stroke={2.5} />
                          Done
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              <BottomTabs
                userId={userId}
                lectureId={activeLectureId}
                resources={currentLecture?.resources ?? []}
                lectureDescription={currentLecture?.description ?? null}
              />
            </div>
          </div>
        </div>

        <aside className="hidden h-full min-h-0 overflow-hidden lg:flex lg:w-[360px] lg:shrink-0 lg:border-l lg:border-border/60 xl:w-[380px]">
          {sidebarContent}
        </aside>
      </div>
    </div>
  );
}
