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
    .select("yt_live_chat_id")
    .eq("id", streamId)
    .single();

  if (streamError || !stream?.yt_live_chat_id) {
    throw new Error("Stream or live chat not found");
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
