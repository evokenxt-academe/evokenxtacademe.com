import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getServiceSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Permanently removes all chat messages and polls (incl. votes) for a stream.
 * Called automatically when a live stream ends.
 */
export async function cleanupStreamEngagement(
  streamId: string,
  supabase?: SupabaseClient,
): Promise<void> {
  const db = supabase ?? getServiceSupabase();

  const { error: pollsError } = await db
    .from("stream_polls")
    .delete()
    .eq("live_stream_id", streamId);

  if (pollsError) {
    throw new Error(`Failed to delete polls: ${pollsError.message}`);
  }

  const { error: chatError } = await db
    .from("chat_messages")
    .delete()
    .eq("live_stream_id", streamId);

  if (chatError) {
    throw new Error(`Failed to delete chat: ${chatError.message}`);
  }
}
