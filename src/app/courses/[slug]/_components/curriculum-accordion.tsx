"use client";

import type { Section } from "@/features/courses/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconLock, IconPlayerPlay } from "@tabler/icons-react";

interface CurriculumAccordionProps {
  sections: Section[];
}

function formatLectureDuration(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds)) return "0m";
  const minutes = Math.round(durationSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export function CurriculumAccordion({ sections }: CurriculumAccordionProps) {
  const isEnrolled = false;

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Curriculum will be available once the course launches.
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="flex flex-col gap-3">
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="rounded-xl border px-4"
        >
          <AccordionTrigger className="py-4">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
              <span className="text-sm font-medium text-foreground">
                {section.title}
              </span>
              <Badge variant="secondary">
                {section.lectures.length} lectures
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="flex flex-col gap-3">
              {section.lectures.map((lecture) => {
                const canPreview = lecture.is_preview && !!lecture.video_url;
                const isLocked = !isEnrolled && !canPreview;

                return (
                  <div
                    key={lecture.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isLocked ? <IconLock /> : <IconPlayerPlay />}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {lecture.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatLectureDuration(lecture.duration_sec)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPreview ? (
                        <Button size="sm" variant="secondary" asChild>
                          <a
                            href={lecture.video_url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconPlayerPlay data-icon="inline-start" />
                            Preview
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <IconLock data-icon="inline-start" />
                          Locked
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
