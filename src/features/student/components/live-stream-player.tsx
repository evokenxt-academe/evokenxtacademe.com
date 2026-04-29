"use client";

import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room";

type LiveStreamPlayerProps = {
  courseId: string;
  courseName?: string;
};

export function LiveStreamPlayer({
  courseId,
  courseName = "",
}: LiveStreamPlayerProps) {
  return <LiveStreamRoom courseId={courseId} courseName={courseName} />;
}
