import { createClient } from "@supabase/supabase-js";

import { fetchLiveChatMessages } from "@/lib/youtube/api";

interface ChatSyncState {
  [streamId: string]: string;
}

const chatSyncState: ChatSyncState = {};

export async function syncYouTubeLiveChat(streamId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: stream, error: streamError } = await supabase
    .from("live_streams")
    .select("yt_live_chat_id, yt_video_id, status, started_at")
    .eq("id", streamId)
    .single();

  if (streamError || !stream?.yt_live_chat_id) {
    throw new Error("Stream or live chat not found");
  }

  // Auto-sync/verify live status from YouTube if our DB thinks it's live
  if (stream.status === "live" && stream.yt_video_id) {
    try {
      const { getBroadcast } = await import("@/lib/youtube/api");
      const broadcast = await getBroadcast(stream.yt_video_id);
      const lifecycle = broadcast.status?.lifeCycleStatus;

      if (lifecycle === "complete" || lifecycle === "revoked") {
        const actualStart = broadcast.snippet?.actualStartTime;
        const actualEnd = broadcast.snippet?.actualEndTime || new Date().toISOString();
        let durationSec = 0;
        if (actualStart && actualEnd) {
          durationSec = Math.floor((new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 1000);
        } else {
          const startedAt = stream.started_at ? new Date(stream.started_at) : new Date();
          durationSec = Math.floor((new Date(actualEnd).getTime() - startedAt.getTime()) / 1000);
        }

        await supabase
          .from("live_streams")
          .update({
            status: "ended",
            ended_at: actualEnd,
            duration_sec: durationSec,
          })
          .eq("id", streamId);

        const { cleanupStreamEngagement } = await import("@/lib/live-stream/cleanup-engagement");
        await cleanupStreamEngagement(streamId, supabase).catch(console.error);

        return {
          success: true,
          messagesSync: 0,
          inserted: 0,
          ended: true,
        };
      }
    } catch (e) {
      console.error("Failed to verify live stream status in chat sync:", e);
    }
  }

  const { messages, nextPageToken } = await fetchLiveChatMessages(
    stream.yt_live_chat_id,
    chatSyncState[streamId],
  );

  let inserted = 0;

  if (messages.length > 0) {
    const { data: existingIds } = await supabase
      .from("chat_messages")
      .select("yt_message_id")
      .eq("live_stream_id", streamId)
      .not("yt_message_id", "is", null);

    const existingIdSet = new Set(
      existingIds?.map((message) => message.yt_message_id) ?? [],
    );
    const newMessages = messages.filter(
      (message) => !existingIdSet.has(message.id),
    );

    if (newMessages.length > 0) {
      const { error: insertError } = await supabase.from("chat_messages").insert(
        newMessages.map((message) => ({
          live_stream_id: streamId,
          author_name: message.author,
          author_avatar: message.thumbnail,
          message: message.text,
          type: "message",
          yt_message_id: message.id,
          is_approved: true,
          user_id: null,
        })),
      );

      if (insertError) {
        throw insertError;
      }

      inserted = newMessages.length;

      await supabase
        .from("live_streams")
        .update({ total_chat_msgs: newMessages.length })
        .eq("id", streamId);
    }
  }

  if (nextPageToken) {
    chatSyncState[streamId] = nextPageToken;
  }

  return {
    success: true,
    messagesSync: messages.length,
    inserted,
  };
}
