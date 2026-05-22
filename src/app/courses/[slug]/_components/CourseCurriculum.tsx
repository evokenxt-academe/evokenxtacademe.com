"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, PlayCircle, Lock } from "lucide-react";
import {
  formatDuration,
  formatLectureDuration,
  type ChapterWithLectures,
} from "@/lib/supabase/queries/course-detail";

interface CourseCurriculumProps {
  chapters: ChapterWithLectures[];
  onLectureClick?: (ytVideoId: string) => void;
}

export function CourseCurriculum({
  chapters,
  onLectureClick,
}: CourseCurriculumProps) {
  const perChapter = useMemo(
    () =>
      chapters.map((ch) => ({
        count: ch.lectures.length,
        duration: ch.lectures.reduce((s, l) => s + l.duration_sec, 0),
      })),
    [chapters]
  );

  if (chapters.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Course Curriculum</h2>
        <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Curriculum content is being prepared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Course Curriculum</h2>

      <div className="rounded-none border border-border/50 bg-card/30 overflow-hidden">
        <Accordion type="multiple" className="w-full rounded-none">
          {chapters.map((chapter, idx) => (
            <AccordionItem
              key={chapter.id}
              value={chapter.id}
              className="border-b last:border-b-0 px-0 rounded-none"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-3.5 text-sm hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/20 rounded-none">
                <div className="flex flex-1 items-center justify-between pr-3 gap-3">
                  <span className="font-semibold text-left leading-snug text-primary/90">
                    {chapter.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
                    {perChapter[idx].count} lecture
                    {perChapter[idx].count !== 1 ? "s" : ""}
                    {" · "}
                    {formatDuration(perChapter[idx].duration)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="hover:rounded-none pb-2 pt-0 ">
                <div className="space-y-px">
                  {chapter.lectures.map((lecture) => {
                    const canPreview =
                      lecture.is_preview && lecture.yt_video_id;
                    return (
                      <button
                        type="button"
                        key={lecture.lecture_id}
                        onClick={() => {
                          if (canPreview && lecture.yt_video_id) {
                            onLectureClick?.(lecture.yt_video_id);
                          }
                        }}
                        disabled={!canPreview}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm text-left transition-colors
                          ${canPreview ? "cursor-pointer hover:bg-muted/40" : "cursor-default opacity-60"}
                        `}
                      >
                        {/* Icon */}
                        <span
                          className={`shrink-0 ${canPreview
                            ? "text-primary"
                            : "text-muted-foreground/50"
                            }`}
                        >
                          {canPreview ? (
                            <PlayCircle className="h-4 w-4" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                        </span>

                        {/* Title */}
                        <span className="flex-1 min-w-0 truncate text-foreground/80">
                          {lecture.lecture_title}
                        </span>

                        {/* Meta: DEMO badge + duration */}
                        <span className="flex items-center gap-2 shrink-0">
                          {lecture.is_preview && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 leading-tight font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                            >
                              Demo
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLectureDuration(lecture.duration_sec)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
