"use client";

import { LiveStreamPlayer } from "@/features/student/components/live-stream-player";

export function LiveStreamPageClient({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) {
  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)]">
      <LiveStreamPlayer courseId={courseId} courseName={courseName} />
    </div>
  );
}
