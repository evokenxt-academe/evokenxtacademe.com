"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { Lock, PlayCircle, Clock } from "lucide-react";
import {
  formatDuration,
  formatLectureDuration,
  type ChapterWithLectures,
  type LectureRow,
} from "@/lib/supabase/queries/course-detail";

interface CurriculumAccordionProps {
  chapters: ChapterWithLectures[];
}

export function CurriculumAccordion({ chapters }: CurriculumAccordionProps) {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const totals = useMemo(() => {
    let lectures = 0;
    let duration = 0;
    for (const ch of chapters) {
      lectures += ch.lectures.length;
      for (const l of ch.lectures) {
        duration += l.duration_sec;
      }
    }
    return { lectures, duration };
  }, [chapters]);

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
      <Card className="rounded-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Course Curriculum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Curriculum content is being prepared.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <CardTitle className="text-xl">Course Curriculum</CardTitle>
          <p className="text-sm text-muted-foreground">
            {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
            {" · "}
            {totals.lectures} lecture{totals.lectures !== 1 ? "s" : ""}
            {" · "}
            {formatDuration(totals.duration)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 sm:px-6 rounded-none">
        <Accordion type="multiple" className="w-full mx-0">
          {chapters.map((chapter, idx) => (
            <AccordionItem
              key={chapter.id}
              value={chapter.id}
              className="border rounded-none mb-2 last:mb-0 px-0 overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-3.5 text-sm hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                <div className="flex flex-1 items-center justify-between pr-3 gap-3">
                  <span className="font-semibold text-left leading-snug">
                    {chapter.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {perChapter[idx].count} lecture
                    {perChapter[idx].count !== 1 ? "s" : ""}
                    {" · "}
                    {formatDuration(perChapter[idx].duration)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 pt-0">
                <div className="space-y-px">
                  {chapter.lectures.map((lecture) => (
                    <LectureItem
                      key={lecture.lecture_id}
                      lecture={lecture}
                      isActive={activePreview === lecture.lecture_id}
                      onToggle={() =>
                        setActivePreview((prev) =>
                          prev === lecture.lecture_id
                            ? null
                            : lecture.lecture_id
                        )
                      }
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ── Lecture Item ──────────────────────────────────────────

interface LectureItemProps {
  lecture: LectureRow;
  isActive: boolean;
  onToggle: () => void;
}

function LectureItem({ lecture, isActive, onToggle }: LectureItemProps) {
  const canPreview = lecture.is_preview && lecture.yt_video_id;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (canPreview) onToggle();
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors
          ${canPreview ? "cursor-pointer hover:bg-muted/60" : "cursor-default"}
          ${isActive ? "bg-muted" : ""}
          ${!canPreview ? "opacity-60" : ""}
        `}
        disabled={!canPreview}
      >
        {/* Icon */}
        <span
          className={`shrink-0 ${canPreview ? "text-primary" : "text-muted-foreground/50"
            }`}
        >
          {canPreview ? (
            <PlayCircle className="h-4 w-4" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Title */}
        <span className="flex-1 min-w-0 truncate">{lecture.lecture_title}</span>

        {/* Meta: Preview badge + duration */}
        <span className="flex items-center gap-2 shrink-0">
          {lecture.is_preview && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 leading-tight font-normal border-green-500/30 text-green-600 bg-green-500/10 dark:text-green-400 dark:bg-green-500/10">
              Free
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatLectureDuration(lecture.duration_sec)}
          </span>
        </span>
      </button>

      {/* Inline video player for preview lectures */}
      {isActive && canPreview && lecture.yt_video_id && (
        <div className="mx-3 mb-2 mt-1 rounded-lg overflow-hidden border bg-black aspect-video">
          <YtcnPlayer
            videoId={lecture.yt_video_id}
            autoplay={true}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
