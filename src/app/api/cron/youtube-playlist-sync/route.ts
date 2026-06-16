import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncAllEnabledPlaylists } from "@/lib/youtube/playlist-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron: sync all chapters with linked YouTube playlists.
 * Schedule: every 15 minutes (vercel.json)
 */
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const result = await syncAllEnabledPlaylists(supabase, "cron");

    console.log("[cron/youtube-playlist-sync]", {
      chaptersProcessed: result.chaptersProcessed,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/youtube-playlist-sync]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Cron sync failed",
      },
      { status: 500 }
    );
  }
}
