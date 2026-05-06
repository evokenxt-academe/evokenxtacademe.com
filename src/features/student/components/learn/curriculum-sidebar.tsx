"use client";

import { useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LectureItem } from "./lecture-item";
import type {
  ChapterWithLectures,
  LectureWithResources,
  ProgressMap,
} from "@/features/student/types/learn";

interface CurriculumSidebarProps {
  chapters: ChapterWithLectures[];
  currentLectureId: string | null;
  progressMap: ProgressMap;
  onSelectLecture: (lecture: LectureWithResources) => void;
  totalLectures: number;
  completedCount: number;
}

export function CurriculumSidebar({
  chapters,
  currentLectureId,
  progressMap,
  onSelectLecture,
  totalLectures,
  completedCount,
}: CurriculumSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressPercent =
    totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  // Find which chapter the current lecture belongs to
  const currentChapterId = chapters.find((s) =>
    s.lectures.some((l) => l.id === currentLectureId)
  )?.id;

  // Scroll active lecture into view
  useEffect(() => {
    if (!currentLectureId) return;
    const timeout = setTimeout(() => {
      const el = document.querySelector(
        `[data-lecture-id="${currentLectureId}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentLectureId]);

  function getLectureStatus(
    lecture: LectureWithResources
  ): "completed" | "current" | "available" | "locked" {
    if (lecture.id === currentLectureId) return "current";
    if (progressMap.get(lecture.id)?.is_completed) return "completed";
    return "available";
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-card/40">
      {/* Progress header */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Course Content</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalLectures} lectures
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {progressPercent}% complete
        </p>
      </div>

      {/* Sections accordion */}
      <ScrollArea className="flex-1 w-full" ref={scrollRef}>
        <Accordion
          type="multiple"
          defaultValue={currentChapterId ? [currentChapterId] : [chapters[0]?.id]}
          className="space-y-1 px-2 py-2"
        >
          {chapters.map((chapter) => {
            const chapterCompleted = chapter.lectures.filter((l) =>
              progressMap.get(l.id)?.is_completed
            ).length;

            return (
              <AccordionItem
                key={chapter.id}
                value={chapter.id}
                className="overflow-hidden rounded-lg border border-transparent bg-background/60 transition-colors data-[state=open]:border-border"
              >
                <AccordionTrigger className="px-3 py-3 text-sm hover:bg-muted/50 hover:no-underline">
                  <div className="flex flex-1 flex-col items-start gap-1 text-left">
                    <span className="font-medium leading-tight">
                      {chapter.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {chapterCompleted}/{chapter.lectures.length} lectures
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <div className="flex flex-col gap-0.5">
                    {chapter.lectures.map((lecture, lectureIndex) => (
                      <LectureItem
                        key={lecture.id}
                        lecture={lecture}
                        status={getLectureStatus(lecture)}
                        index={lectureIndex}
                        onClick={() => onSelectLecture(lecture)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

export function CurriculumSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-1.5 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
