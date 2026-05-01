import { notFound } from "next/navigation";
import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

/**
 * Student Live Stream Page
 * Route: /dashboard/live/[courseId]
 *
 * Features:
 * - Video player (YouTube embed)
 * - Real-time chat powered by Supabase Realtime
 * - Enrollment verification
 * - Enterprise dashboard UI
 */
export default async function LiveStreamPage({ params }: PageProps) {
  const { courseId } = await params;

  if (!courseId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Live Class</h1>
          <p className="text-muted-foreground">
            Watch the live stream and chat with classmates in real-time.
          </p>
        </div>

        {/* Live stream room with video player and chat */}
        <LiveStreamRoom courseId={courseId} courseName="" />

        {/* Course Info Section */}
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">About This Class</h2>
            <p className="mt-2 text-muted-foreground">
              Live classes are interactive sessions where you can watch the
              instructor and chat with your classmates in real-time. Messages
              are visible to all enrolled students.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-6">
            <h3 className="font-semibold">Tips for Best Experience</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>✓ Use a stable internet connection for smooth streaming</li>
              <li>
                ✓ Enable notifications to get alerted when a live class starts
              </li>
              <li>✓ Keep chat respectful and focused on the course content</li>
              <li>✓ Messages are logged and moderated by instructors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
