"use client";

import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room";

export function LiveStreamPageClient({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) {
  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)]">
      <LiveStreamRoom courseId={courseId} courseName={courseName} />
    </div>
  );
}
