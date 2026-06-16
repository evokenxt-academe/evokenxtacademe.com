import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { syncCoursePlaylists } from "@/lib/youtube/playlist-sync";

export const runtime = "nodejs";

/**
 * POST /api/admin/courses/[courseId]/sync-youtube
 * Sync all linked YouTube playlists for a course.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) return auth.error;

  const { courseId } = await params;

  try {
    const result = await syncCoursePlaylists(auth.supabase, courseId, "manual");

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync-youtube/course]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
