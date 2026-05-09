"use client";

import { IconCheck, IconPlayerPlay, IconLock } from "@tabler/icons-react";
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
  index,
  onClick,
}: LectureItemProps) {
  const isDisabled = status === "locked";

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        "hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        status === "current" && "bg-accent font-medium shadow-sm",
        status === "completed" && "text-muted-foreground",
        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
      )}
      data-lecture-id={lecture.id}
    >
      {/* Status icon */}
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
          status === "completed" &&
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
          status === "current" && "bg-primary text-primary-foreground",
          status === "available" && "bg-muted text-muted-foreground",
          status === "locked" && "bg-muted text-muted-foreground"
        )}
      >
        {status === "completed" ? (
          <IconCheck className="size-3.5" />
        ) : status === "locked" ? (
          <IconLock className="size-3" />
        ) : status === "current" ? (
          <IconPlayerPlay className="size-3" />
        ) : (
          <span>{index + 1}</span>
        )}
      </span>

      {/* Lecture title */}
      <span className="flex-1 truncate">{lecture.title}</span>

      {/* Duration */}
      {lecture.duration_sec > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDuration(lecture.duration_sec)}
        </span>
      )}
    </button>
  );
}
