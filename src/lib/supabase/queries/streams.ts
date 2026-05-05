/**
 * Live Streams Query Layer
 * =======================
 * Queries for live streams, recordings, and stream management
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.v2.types";

export interface StreamRow {
    id: string;
    title: string;
    course_title: string;
    instructor_name: string;
    scheduled_at: string;
    status: "scheduled" | "live" | "ended";
    viewers_count: number;
    duration_minutes: number | null;
    recording_url: string | null;
}

/**
 * Get all live streams
 */
export async function getAllStreams(
    supabase: SupabaseClient<Database>,
    filters?: {
        course_id?: string;
        status?: "scheduled" | "live" | "ended";
    }
): Promise<StreamRow[]> {
    let query = supabase
        .from("live_streams")
        .select(
            `id, title, scheduled_at, status, viewers_count, duration_minutes, recording_url,
       course:courses(title),
       instructor:users(name)`
        )
        .order("scheduled_at", { ascending: false });

    if (filters?.course_id) {
        query = query.eq("course_id", filters.course_id);
    }

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[streams] getAllStreams error:", error.message);
        return [];
    }

    return (data ?? []).map((stream: any) => ({
        id: stream.id,
        title: stream.title,
        course_title: stream.course?.title || "Unknown",
        instructor_name: stream.instructor?.name || "Unknown",
        scheduled_at: new Date(stream.scheduled_at).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
        status: stream.status,
        viewers_count: stream.viewers_count || 0,
        duration_minutes: stream.duration_minutes,
        recording_url: stream.recording_url,
    }));
}

/**
 * Get stream by ID with details
 */
export async function getStreamById(
    supabase: SupabaseClient<Database>,
    streamId: string
): Promise<{
    id: string;
    title: string;
    description: string;
    course_id: string;
    instructor_id: string;
    scheduled_at: string;
    status: string;
    yt_video_id?: string;
    yt_stream_key?: string;
    viewers_count: number;
} | null> {
    const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("id", streamId)
        .single();

    if (error) {
        console.error("[streams] getStreamById error:", error.message);
        return null;
    }

    return data || null;
}

/**
 * Create new live stream
 */
export async function createStream(
    supabase: SupabaseClient<Database>,
    streamData: {
        title: string;
        description?: string;
        course_id: string;
        instructor_id: string;
        scheduled_at: string;
        yt_video_id?: string;
        yt_stream_key?: string;
    }
): Promise<{ id: string } | null> {
    const { data, error } = await supabase
        .from("live_streams")
        .insert([{ ...streamData, status: "scheduled", viewers_count: 0 }])
        .select("id")
        .single();

    if (error) {
        console.error("[streams] createStream error:", error.message);
        return null;
    }

    return data;
}

/**
 * Update stream status
 */
export async function updateStreamStatus(
    supabase: SupabaseClient<Database>,
    streamId: string,
    status: "scheduled" | "live" | "ended"
): Promise<boolean> {
    const { error } = await supabase
        .from("live_streams")
        .update({ status })
        .eq("id", streamId);

    if (error) {
        console.error("[streams] updateStreamStatus error:", error.message);
        return false;
    }

    return true;
}

/**
 * Update viewer count
 */
export async function updateViewerCount(
    supabase: SupabaseClient<Database>,
    streamId: string,
    count: number
): Promise<boolean> {
    const { error } = await supabase
        .from("live_streams")
        .update({ viewers_count: count })
        .eq("id", streamId);

    if (error) {
        console.error("[streams] updateViewerCount error:", error.message);
        return false;
    }

    return true;
}

/**
 * Get upcoming streams for admin dashboard
 */
export async function getUpcomingStreams(
    supabase: SupabaseClient<Database>,
    days: number = 7
): Promise<StreamRow[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from("live_streams")
        .select(
            `id, title, scheduled_at, status, viewers_count,
       course:courses(title),
       instructor:users(name)`
        )
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", future.toISOString())
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true });

    if (error) {
        console.error("[streams] getUpcomingStreams error:", error.message);
        return [];
    }

    return (data ?? []).map((stream: any) => ({
        id: stream.id,
        title: stream.title,
        course_title: stream.course?.title || "Unknown",
        instructor_name: stream.instructor?.name || "Unknown",
        scheduled_at: new Date(stream.scheduled_at).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
        status: stream.status,
        viewers_count: stream.viewers_count || 0,
        duration_minutes: null,
        recording_url: null,
    }));
}
