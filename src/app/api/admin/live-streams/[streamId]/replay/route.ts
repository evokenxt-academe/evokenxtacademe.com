import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { streamId } = await params;
  const body = await req.json().catch(() => ({}));
  const recordingUrl = body.recording_url as string | undefined;

  const { data: stream } = await auth.supabase
    .from("live_streams")
    .select("yt_video_id")
    .eq("id", streamId)
    .single();

  const { error } = await auth.supabase
    .from("live_streams")
    .update({
      status: "replay",
      recording_url:
        recordingUrl ??
        (stream?.yt_video_id
          ? `https://www.youtube.com/watch?v=${stream.yt_video_id}`
          : null),
    })
    .eq("id", streamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
