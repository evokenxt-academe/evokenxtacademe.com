"use client";

import { memo, useMemo } from "react";
import type { SectionWithLectures, FlatLecture, ProgressMap } from "../types";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconPlayerPlayFilled,
  IconCircleCheckFilled,
  IconClock,
  IconFileText,
  IconX,
} from "@tabler/icons-react";

// ─── Helpers ──────────────────────────────────────────────────────

function formatDurationShort(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ─── Lecture Item ─────────────────────────────────────────────────

interface LectureItemProps {
  lecture: FlatLecture;
  isActive: boolean;
  isCompleted: boolean;
  onClick: (lecture: FlatLecture) => void;
}

const LectureItem = memo(function LectureItem({
  lecture,
  isActive,
  isCompleted,
  onClick,
}: LectureItemProps) {
  return (
    <button
      onClick={() => onClick(lecture)}
      className={cn(
        "group/lecture flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-accent"
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 flex-shrink-0">
        {isCompleted ? (
          <IconCircleCheckFilled className="size-4 text-emerald-500" />
        ) : isActive ? (
          <IconPlayerPlayFilled className="size-4 text-primary" />
        ) : (
          <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm leading-snug",
            isActive ? "font-medium" : "font-normal"
          )}
        >
          {lecture.index + 1}. {lecture.title}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconClock className="size-3" />
            {formatDurationShort(lecture.duration_sec)}
          </span>
        </div>
      </div>
    </button>
  );
});

// ─── Sidebar ──────────────────────────────────────────────────────

interface CurriculumSidebarProps {
  sections: SectionWithLectures[];
  currentLecture: FlatLecture | null;
  progressMap: ProgressMap;
  onSelectLecture: (lecture: FlatLecture) => void;
  courseName: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function CurriculumSidebar({
  sections,
  currentLecture,
  progressMap,
  onSelectLecture,
  courseName,
  isMobileOpen,
  onMobileClose,
}: CurriculumSidebarProps) {
  // Build flat lecture list for each section
  const sectionLectures = useMemo(() => {
    let globalIndex = 0;
    return sections.map((section) => ({
      ...section,
      flatLectures: section.lectures.map((lec) => {
        const flat: FlatLecture = {
          id: lec.id,
          title: lec.title,
          video_url: lec.video_url,
          duration_sec: lec.duration_sec,
          sectionId: section.id,
          sectionTitle: section.title,
          index: globalIndex++,
        };
        return flat;
      }),
    }));
  }, [sections]);

  // Compute completion stats per section
  const sectionStats = useMemo(() => {
    return sectionLectures.map((section) => {
      const total = section.flatLectures.length;
      const completed = section.flatLectures.filter(
        (l) => progressMap[l.id]?.is_completed
      ).length;
      const totalDuration = section.flatLectures.reduce(
        (sum, l) => sum + l.duration_sec,
        0
      );
      return { total, completed, totalDuration };
    });
  }, [sectionLectures, progressMap]);

  // Find current section to auto-expand
  const activeSectionId = currentLecture?.sectionId ?? sections[0]?.id ?? "";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">
            Course Content
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {courseName}
          </p>
        </div>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="flex items-center justify-center rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent lg:hidden"
          aria-label="Close sidebar"
        >
          <IconX className="size-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <Accordion
          type="single"
          defaultValue={activeSectionId}
          collapsible
          className="px-2 py-2"
        >
          {sectionLectures.map((section, sIdx) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-b-0"
            >
              <AccordionTrigger className="rounded-md px-2 py-2.5 text-sm hover:bg-accent hover:no-underline [&[data-state=open]]:bg-accent/50">
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                  <span className="truncate text-sm font-medium">
                    {section.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sectionStats[sIdx].completed}/{sectionStats[sIdx].total}{" "}
                    lectures
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="flex flex-col gap-0.5">
                  {section.flatLectures.map((lecture) => (
                    <LectureItem
                      key={lecture.id}
                      lecture={lecture}
                      isActive={currentLecture?.id === lecture.id}
                      isCompleted={
                        progressMap[lecture.id]?.is_completed ?? false
                      }
                      onClick={onSelectLecture}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[340px] flex-shrink-0 border-l border-border bg-card lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-[320px] bg-card shadow-xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
