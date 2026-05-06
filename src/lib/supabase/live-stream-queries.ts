"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getStudentLiveStreams() {
  const { data, error } = await supabase
    .from("live_streams")
    .select(`
      id, title, description, status, scheduled_at, started_at, ended_at,
      yt_video_id, yt_live_chat_id, concurrent_viewers, peak_viewers,
      total_chat_msgs, duration_sec, slug, visibility, yt_thumbnail_url,
      updated_at,
      courses!inner(
        id, title, slug, thumbnail_url,
        subjects(name, code,
          program_levels(label,
            programs(body)
          )
        )
      ),
      users!instructor_id(name, avatar)
    `)
    .in("status", ["scheduled", "live", "ended", "replay"])
    .order("scheduled_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getStreamById(streamId: string) {
  const { data, error } = await supabase
    .from("live_streams")
    .select(`
      *,
      courses(
        id, title, slug,
        instructor:users!instructor_id(id, name, avatar),
        subjects(name, code,
          program_levels(label,
            programs(body)
          )
        )
      ),
      users!instructor_id(id, name, avatar)
    `)
    .eq("id", streamId)
    .single();

  if (error) throw error;
  return data;
}

export async function registerForStream(streamId: string, userId: string) {
  const { error } = await supabase.from("stream_registrations").upsert(
    { live_stream_id: streamId, user_id: userId },
    { onConflict: "live_stream_id,user_id" },
  );
  if (error) throw error;
}

export async function markStreamAttendance(streamId: string, userId: string) {
  const { error } = await supabase
    .from("stream_registrations")
    .update({ attended: true, join_time: new Date().toISOString() })
    .eq("live_stream_id", streamId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getStreamChat(streamId: string, limit = 50) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, message, type, is_pinned, created_at, author_name, author_avatar, users(name, avatar)",
    )
    .eq("live_stream_id", streamId)
    .eq("is_deleted", false)
    .eq("is_approved", true)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function sendChatMessage(
  streamId: string,
  userId: string,
  message: string,
) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ live_stream_id: streamId, user_id: userId, message, type: "message" });
  if (error) throw error;
}

export async function getActivePolls(streamId: string) {
  const { data, error } = await supabase
    .from("stream_polls")
    .select("*, stream_poll_votes(user_id, option_id)")
    .eq("live_stream_id", streamId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data ?? [];
}

export async function votePoll(pollId: string, optionId: number, userId: string) {
  const { error } = await supabase.from("stream_poll_votes").upsert(
    { poll_id: pollId, option_id: optionId, user_id: userId },
    { onConflict: "poll_id,user_id" },
  );
  if (error) throw error;
}
