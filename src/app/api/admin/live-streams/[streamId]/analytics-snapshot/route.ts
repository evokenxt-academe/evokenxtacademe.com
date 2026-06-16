import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { getVideoStatistics } from "@/lib/youtube/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { streamId } = await params;
  const { supabase } = auth;

  const { data: stream, error: streamError } = await supabase
    .from("live_streams")
    .select("yt_video_id, peak_viewers, started_at, status")
    .eq("id", streamId)
    .single();

  if (streamError || !stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  let concurrentViewers = stream.status === "live" ? 0 : 0;

  if (stream.yt_video_id && stream.status === "live") {
    try {
      const stats = await getVideoStatistics(stream.yt_video_id);
      concurrentViewers = stats.concurrentViewers;
    } catch {
      const { data: latest } = await supabase
        .from("live_streams")
        .select("concurrent_viewers")
        .eq("id", streamId)
        .single();
      concurrentViewers = latest?.concurrent_viewers ?? 0;
    }
  } else {
    const { data: latest } = await supabase
      .from("live_streams")
      .select("concurrent_viewers")
      .eq("id", streamId)
      .single();
    concurrentViewers = latest?.concurrent_viewers ?? 0;
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentMsgs } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("live_stream_id", streamId)
    .gte("created_at", oneMinuteAgo);

  const chatRate = recentMsgs ?? 0;
  const newPeak = Math.max(stream.peak_viewers ?? 0, concurrentViewers);

  const { error: insertError } = await supabase.from("stream_analytics").insert({
    live_stream_id: streamId,
    concurrent_viewers: concurrentViewers,
    chat_rate_per_min: chatRate,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("live_streams")
    .update({
      concurrent_viewers: concurrentViewers,
      peak_viewers: newPeak,
    })
    .eq("id", streamId);

  return NextResponse.json({
    success: true,
    concurrent_viewers: concurrentViewers,
    peak_viewers: newPeak,
  });
}
