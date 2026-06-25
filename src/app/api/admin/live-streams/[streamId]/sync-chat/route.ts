import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import { syncYouTubeLiveChat } from "@/lib/live-stream/sync-youtube-chat";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) return auth.error;

  const { streamId } = await params;

  try {
    const result = await syncYouTubeLiveChat(streamId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync live chat",
      },
      { status: 500 },
    );
  }
}
