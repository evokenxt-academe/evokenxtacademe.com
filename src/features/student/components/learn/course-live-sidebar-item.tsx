"use client";

import Link from "next/link";
import { IconBroadcast } from "@tabler/icons-react";

import { useCourseLiveStatus } from "@/hooks/live/use-course-live-status";

interface CourseLiveSidebarItemProps {
  courseId: string;
  courseSlug: string;
}

export function CourseLiveSidebarItem({
  courseId,
  courseSlug,
}: CourseLiveSidebarItemProps) {
  const { liveStream, isLive } = useCourseLiveStatus(courseId);

  if (!isLive || !liveStream) return null;

  return (
    <Link
      href={`/learn/${courseSlug}/live`}
      className="flex items-center gap-3 border-b border-rose-500/15 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] px-4 py-3 transition-all duration-200 hover:bg-rose-500/[0.08] group"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-rose-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none mb-1">
          Live class in progress
        </p>
        <p className="truncate text-[13px] font-medium leading-tight text-foreground/90 group-hover:text-foreground">
          {liveStream.title}
        </p>
      </div>
      <IconBroadcast className="size-4 shrink-0 text-rose-600/80 transition-transform group-hover:scale-105" />
    </Link>
  );
}
