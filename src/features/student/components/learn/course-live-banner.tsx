"use client";

import Link from "next/link";
import { IconArrowRight, IconBroadcast } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useCourseLiveStatus } from "@/hooks/live/use-course-live-status";

interface CourseLiveBannerProps {
  courseId: string;
  courseSlug: string;
}

export function CourseLiveBanner({ courseId, courseSlug }: CourseLiveBannerProps) {
  const { liveStream, isLive } = useCourseLiveStatus(courseId);

  if (!isLive || !liveStream) return null;

  return (
    <div className="w-full border-b border-rose-500/15 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] backdrop-blur-xs">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Live
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground tracking-tight">
              {liveStream.title}
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Interactive live session is in progress for this course
            </p>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="w-full shrink-0 bg-rose-600 hover:bg-rose-700 text-white text-[12px] h-8 sm:w-auto font-medium"
        >
          <Link href={`/learn/${courseSlug}/live`}>
            <IconBroadcast className="mr-1.5 h-3.5 w-3.5" stroke={2} />
            Join live class
            <IconArrowRight className="ml-1.5 h-3.5 w-3.5" stroke={2} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
