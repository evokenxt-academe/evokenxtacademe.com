"use client";

import {
  IconCheck,
  IconPlayerPlay,
  IconLock,
  IconCircle,
  IconClock,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/supabase/queries";
import type { LectureWithResources } from "@/features/student/types/learn";

type LectureStatus = "completed" | "current" | "available" | "locked";

interface LectureItemProps {
  lecture: LectureWithResources;
  status: LectureStatus;
  index: number;
  onClick: () => void;
}

export function LectureItem({
  lecture,
  status,
  onClick,
}: LectureItemProps) {
  const isDisabled = status === "locked";

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 border-l-[3px] py-2.5 pl-3.5 pr-4 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        status === "current"
          ? "border-l-primary bg-primary/[0.04] dark:bg-primary/[0.08]"
          : "border-l-transparent hover:bg-muted/40",
        status === "completed" && "text-muted-foreground/80 hover:text-foreground",
        isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
      data-lecture-id={lecture.id}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        {status === "completed" ? (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
            <IconCheck className="size-3 text-emerald-600 dark:text-emerald-400" stroke={3} />
          </span>
        ) : status === "locked" ? (
          <IconLock className="size-3.5 text-muted-foreground/60" stroke={1.8} />
        ) : status === "current" ? (
          <span className="relative flex size-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/25 opacity-75" />
            <IconPlayerPlay className="relative size-3 fill-primary text-primary" stroke={2} />
          </span>
        ) : (
          <IconCircle className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" stroke={1.8} />
        )}
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug tracking-tight transition-colors",
          status === "current"
            ? "font-medium text-primary-foreground dark:text-primary-foreground"
            : status === "completed"
            ? "text-muted-foreground"
            : "text-foreground/85 group-hover:text-foreground",
        )}
      >
        {lecture.title}
      </span>

      {lecture.duration_sec > 0 && (
        <span className="flex items-center gap-1 shrink-0 text-[11px] font-mono tabular-nums text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
          <IconClock className="size-3" stroke={1.5} />
          {formatDuration(lecture.duration_sec)}
        </span>
      )}
    </button>
  );
}
