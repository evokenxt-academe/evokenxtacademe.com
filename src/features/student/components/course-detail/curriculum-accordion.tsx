"use client";

import {
  IconPlayerPlay,
  IconBook,
  IconQuestionMark,
  IconClipboardCheck,
  IconCheck,
  IconLock,
  IconClock,
} from "@tabler/icons-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Module, LessonType, LessonStatus } from "@/features/student/types/course-detail";

interface CurriculumAccordionProps {
  modules: Module[];
}

const typeIcon: Record<LessonType, React.ReactNode> = {
  video: <IconPlayerPlay className="size-3.5" />,
  reading: <IconBook className="size-3.5" />,
  quiz: <IconQuestionMark className="size-3.5" />,
  assignment: <IconClipboardCheck className="size-3.5" />,
};

const statusIcon: Record<LessonStatus, React.ReactNode> = {
  completed: <IconCheck className="size-3.5 text-primary" />,
  current: <IconClock className="size-3.5 text-primary" />,
  locked: <IconLock className="size-3.5 text-muted-foreground/50" />,
};

export function CurriculumAccordion({ modules }: CurriculumAccordionProps) {
  if (modules.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBook />
          </EmptyMedia>
          <EmptyTitle>No curriculum yet</EmptyTitle>
          <EmptyDescription>
            The curriculum for this course is being prepared. Check back soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Default open: first module that has a current or locked lesson
  const defaultModule =
    modules.find((m) => m.lessons.some((l) => l.status === "current"))?.id ??
    modules[0]?.id;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultModule}
      className="flex w-full flex-col"
    >
      {modules.map((mod, idx) => (
        <AccordionItem key={mod.id} value={mod.id}>
          <AccordionTrigger className="px-1">
            <div className="flex flex-1 flex-col gap-0.5 pr-2 text-left">
              <span className="text-sm font-medium">
                {idx + 1}. {mod.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {mod.lessonsCount} lessons · {mod.duration}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col" role="list">
              {mod.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    lesson.status === "current" && "bg-primary/5",
                    lesson.status === "locked" && "opacity-50"
                  )}
                >
                  {/* Type icon */}
                  <span className="text-muted-foreground">
                    {typeIcon[lesson.type]}
                  </span>

                  {/* Title */}
                  <span
                    className={cn(
                      "flex-1",
                      lesson.status === "current" && "font-medium text-primary",
                      lesson.status === "locked" && "text-muted-foreground"
                    )}
                  >
                    {lesson.title}
                  </span>

                  {/* Duration */}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {lesson.duration}
                  </span>

                  {/* Status icon */}
                  <span className="shrink-0">{statusIcon[lesson.status]}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
