import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { syncChapterFromPlaylist } from "@/lib/youtube/playlist-sync";

export const runtime = "nodejs";

/**
 * POST /api/admin/chapters/[chapterId]/sync-youtube
 * Manual "Sync Now" for a single chapter's YouTube playlist.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) return auth.error;

  const { chapterId } = await params;

  try {
    const result = await syncChapterFromPlaylist(auth.supabase, chapterId, {
      trigger: "manual",
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync-youtube/chapter]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
