"use client";

import { useEffect, useState } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/supabase/queries";
import { LectureItem } from "./lecture-item";
import { CourseLiveSidebarItem } from "./course-live-sidebar-item";
import type {
  ChapterWithLectures,
  LectureWithResources,
  ProgressMap,
} from "@/features/student/types/learn";

interface CurriculumSidebarProps {
  courseId: string;
  courseSlug: string;
  chapters: ChapterWithLectures[];
  currentLectureId: string | null;
  progressMap: ProgressMap;
  onSelectLecture: (lecture: LectureWithResources) => void;
  totalLectures: number;
  completedCount: number;
}

export function CurriculumSidebar({
  courseId,
  courseSlug,
  chapters,
  currentLectureId,
  progressMap,
  onSelectLecture,
  totalLectures,
  completedCount,
}: CurriculumSidebarProps) {
  const progressPercent =
    totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const currentChapterId = chapters.find((s) =>
    s.lectures.some((l) => l.id === currentLectureId),
  )?.id;

  const [openChapters, setOpenChapters] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (currentChapterId) initial.add(currentChapterId);
    else if (chapters[0]?.id) initial.add(chapters[0].id);
    return initial;
  });

  useEffect(() => {
    if (currentChapterId) {
      setOpenChapters((prev) => new Set(prev).add(currentChapterId));
    }
  }, [currentChapterId]);

  useEffect(() => {
    if (!currentLectureId) return;
    const timeout = setTimeout(() => {
      document
        .querySelector(`[data-lecture-id="${currentLectureId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 200);
    return () => clearTimeout(timeout);
  }, [currentLectureId]);

  function toggleChapter(chapterId: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  function getLectureStatus(
    lecture: LectureWithResources,
  ): "completed" | "current" | "available" | "locked" {
    if (lecture.id === currentLectureId) return "current";
    if (progressMap.get(lecture.id)?.is_completed) return "completed";
    return "available";
  }

  // Circular progress ring setup
  const strokeRadius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Premium Circular Progress Header */}
      <div className="shrink-0 border-b border-border/60 bg-muted/[0.08] px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex size-14 shrink-0 items-center justify-center">
            <svg className="absolute inset-0 size-full -rotate-90">
              {/* Track circle */}
              <circle
                cx="28"
                cy="28"
                r={strokeRadius}
                className="stroke-muted-foreground/15 fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx="28"
                cy="28"
                r={strokeRadius}
                className="stroke-primary fill-transparent transition-all duration-500 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[11px] font-bold font-mono text-foreground">
              {progressPercent}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
              Course content
            </h3>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {completedCount} of {totalLectures} lectures completed
            </p>
          </div>
        </div>
      </div>

      <CourseLiveSidebarItem courseId={courseId} courseSlug={courseSlug} />

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {chapters.map((chapter) => {
          const isOpen = openChapters.has(chapter.id);
          const chapterLectures = chapter.lectures;
          const chapterCompleted = chapterLectures.filter((l) =>
            progressMap.get(l.id)?.is_completed,
          ).length;
          const isChapterFullyCompleted = chapterLectures.length > 0 && chapterCompleted === chapterLectures.length;
          const chapterDuration = chapterLectures.reduce((acc, l) => acc + l.duration_sec, 0);

          return (
            <div
              key={chapter.id}
              className="border-b border-border/40 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggleChapter(chapter.id)}
                className="group flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Chapter Progress Icon */}
                  <div className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                    {isChapterFullyCompleted ? (
                      <div className="flex size-4.5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <IconCheck className="size-3.5" stroke={3} />
                      </div>
                    ) : (
                      <div className="size-3.5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                        {chapterCompleted > 0 && (
                          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
                      {chapter.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
                      <span>
                        {chapterCompleted}/{chapterLectures.length} completed
                      </span>
                      {chapterDuration > 0 && (
                        <>
                          <span className="size-1 rounded-full bg-muted-foreground/30" />
                          <span>
                            {formatDuration(chapterDuration)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <IconChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-muted-foreground/70 transition-transform duration-250 group-hover:text-muted-foreground",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Smooth Animated Height transition using CSS grid-rows trick */}
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden min-h-0 pb-1">
                  {chapterLectures.map((lecture, lectureIndex) => (
                    <LectureItem
                      key={lecture.id}
                      lecture={lecture}
                      status={getLectureStatus(lecture)}
                      index={lectureIndex}
                      onClick={() => onSelectLecture(lecture)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CurriculumSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-28 rounded-sm" />
          <Skeleton className="h-3 w-20 rounded-sm" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2 border-b border-border/40 pb-4">
          <Skeleton className="h-5 w-3/4 rounded-sm" />
          <Skeleton className="h-3.5 w-1/2 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
