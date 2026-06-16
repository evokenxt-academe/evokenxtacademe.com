/**
 * YouTube Playlist → LMS Lecture sync service
 *
 * Idempotent: upserts by (chapter_id, yt_video_id)
 * Updates metadata when title/thumbnail/description changes on YouTube
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccessToken } from "./getAccessToken";
import { parseIsoDuration } from "./parse-duration";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

export type SyncTrigger = "manual" | "cron" | "webhook";

export type PlaylistSyncResult = {
  chapterId: string;
  playlistId: string;
  videosFound: number;
  lecturesCreated: number;
  lecturesUpdated: number;
  errors: string[];
};

type PlaylistItem = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string | null;
  position: number;
};

type VideoDetails = {
  durationSec: number;
};

async function resolveApiKey(): Promise<string | null> {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || null;
}

async function fetchWithAuth(url: string): Promise<Response> {
  const apiKey = await resolveApiKey();
  if (apiKey) {
    const separator = url.includes("?") ? "&" : "?";
    return fetch(`${url}${separator}key=${apiKey}`);
  }

  const accessToken = await getAccessToken();
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function fetchPlaylistDetails(
  playlistId: string
): Promise<{ title: string; description: string } | null> {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      id: playlistId,
    });
    const res = await fetchWithAuth(
      `${YOUTUBE_API}/playlists?${params.toString()}`
    );
    if (!res.ok) {
      console.error(`YouTube API /playlists returned status ${res.status}`);
      return null;
    }
    const data = await res.json();
    const item = data.items?.[0];
    if (!item?.snippet) return null;
    return {
      title: item.snippet.title || "",
      description: item.snippet.description || "",
    };
  } catch (err) {
    console.error("Failed to fetch playlist details:", err);
    return null;
  }
}

async function fetchAllPlaylistItems(
  playlistId: string
): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetchWithAuth(
      `${YOUTUBE_API}/playlistItems?${params.toString()}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err?.error?.message || `YouTube playlistItems API error (${res.status})`
      );
    }

    const data = await res.json();

    for (const item of data.items || []) {
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      const thumbs = item.snippet?.thumbnails;
      items.push({
        id: item.id,
        videoId,
        title: item.snippet?.title || "Untitled",
        description: item.snippet?.description || "",
        thumbnailUrl:
          thumbs?.maxres?.url ||
          thumbs?.high?.url ||
          thumbs?.medium?.url ||
          thumbs?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: item.snippet?.publishedAt || null,
        position: item.snippet?.position ?? items.length,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(
  videoIds: string[]
): Promise<Map<string, VideoDetails>> {
  const map = new Map<string, VideoDetails>();
  if (videoIds.length === 0) return map;

  const apiKey = await resolveApiKey();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "contentDetails",
      id: batch.join(","),
    });

    let res: Response;
    if (apiKey) {
      params.set("key", apiKey);
      res = await fetch(`${YOUTUBE_API}/videos?${params.toString()}`);
    } else {
      const accessToken = await getAccessToken();
      res = await fetch(`${YOUTUBE_API}/videos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!res.ok) continue;

    const data = await res.json();
    for (const item of data.items || []) {
      map.set(item.id, {
        durationSec: parseIsoDuration(item.contentDetails?.duration || ""),
      });
    }
  }

  return map;
}

export async function syncChapterFromPlaylist(
  supabase: SupabaseClient,
  chapterId: string,
  options: { trigger?: SyncTrigger; courseId?: string } = {}
): Promise<PlaylistSyncResult> {
  const trigger = options.trigger ?? "manual";
  const result: PlaylistSyncResult = {
    chapterId,
    playlistId: "",
    videosFound: 0,
    lecturesCreated: 0,
    lecturesUpdated: 0,
    errors: [],
  };

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, title, description, course_id, youtube_playlist_id, yt_sync_enabled, yt_sync_title_desc")
    .eq("id", chapterId)
    .single();

  if (chapterError || !chapter) {
    throw new Error(chapterError?.message || "Chapter not found");
  }

  if (!chapter.youtube_playlist_id) {
    throw new Error("Chapter has no YouTube playlist linked");
  }

  if (!chapter.yt_sync_enabled) {
    throw new Error("YouTube sync is disabled for this chapter");
  }

  result.playlistId = chapter.youtube_playlist_id;

  const { data: logRow } = await supabase
    .from("youtube_sync_logs")
    .insert({
      chapter_id: chapterId,
      course_id: options.courseId ?? chapter.course_id,
      trigger_source: trigger,
      status: "running",
      playlist_id: chapter.youtube_playlist_id,
    })
    .select("id")
    .single();

  const logId = logRow?.id;

  try {
    const playlistItems = await fetchAllPlaylistItems(chapter.youtube_playlist_id);
    result.videosFound = playlistItems.length;

    // Sync playlist title & description to chapter if enabled
    if (chapter.yt_sync_title_desc !== false) {
      try {
        const playlistMeta = await fetchPlaylistDetails(chapter.youtube_playlist_id);
        if (playlistMeta) {
          const updatePayload: Record<string, any> = {};
          if (playlistMeta.title && playlistMeta.title !== chapter.title) {
            updatePayload.title = playlistMeta.title;
          }
          if (playlistMeta.description && playlistMeta.description !== chapter.description) {
            updatePayload.description = playlistMeta.description;
          }
          if (Object.keys(updatePayload).length > 0) {
            await supabase
              .from("chapters")
              .update(updatePayload)
              .eq("id", chapterId);
            
            chapter.title = updatePayload.title ?? chapter.title;
            chapter.description = updatePayload.description ?? chapter.description;
          }
        }
      } catch (metaErr) {
        console.error("Failed to auto-sync playlist title/description:", metaErr);
      }
    }

    const videoIds = playlistItems.map((i) => i.videoId);
    const detailsMap = await fetchVideoDetails(videoIds);

    const { data: existingLectures } = await supabase
      .from("lectures")
      .select("id, yt_video_id")
      .eq("chapter_id", chapterId);

    const existingByVideoId = new Map(
      (existingLectures || [])
        .filter((l) => l.yt_video_id)
        .map((l) => [l.yt_video_id as string, l.id as string])
    );

    const now = new Date().toISOString();

    for (const item of playlistItems) {
      const durationSec = detailsMap.get(item.videoId)?.durationSec ?? 0;
      const payload = {
        chapter_id: chapterId,
        title: item.title,
        description: item.description || null,
        video_url: `https://www.youtube.com/watch?v=${item.videoId}`,
        video_provider: "youtube" as const,
        yt_video_id: item.videoId,
        yt_playlist_item_id: item.id,
        thumbnail_url: item.thumbnailUrl,
        published_at: item.publishedAt,
        position: item.position,
        duration_sec: durationSec,
        yt_synced_at: now,
      };

      const existingId = existingByVideoId.get(item.videoId);

      if (existingId) {
        const { error: updateError } = await supabase
          .from("lectures")
          .update(payload)
          .eq("id", existingId);

        if (updateError) {
          result.errors.push(`Update ${item.videoId}: ${updateError.message}`);
        } else {
          result.lecturesUpdated++;
        }
      } else {
        const { error: insertError } = await supabase.from("lectures").insert({
          ...payload,
          is_published: true,
          is_preview: false,
        });

        if (insertError) {
          result.errors.push(`Insert ${item.videoId}: ${insertError.message}`);
        } else {
          result.lecturesCreated++;
        }
      }
    }

    const syncStatus =
      result.errors.length === 0
        ? "success"
        : result.lecturesCreated + result.lecturesUpdated > 0
          ? "partial"
          : "failed";

    await supabase
      .from("chapters")
      .update({
        yt_last_synced_at: now,
        yt_sync_error: result.errors.length > 0 ? result.errors.join("; ") : null,
      })
      .eq("id", chapterId);

    if (logId) {
      await supabase
        .from("youtube_sync_logs")
        .update({
          status: syncStatus,
          videos_found: result.videosFound,
          lectures_created: result.lecturesCreated,
          lectures_updated: result.lecturesUpdated,
          error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
          finished_at: now,
        })
        .eq("id", logId);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    result.errors.push(message);

    await supabase
      .from("chapters")
      .update({ yt_sync_error: message })
      .eq("id", chapterId);

    if (logId) {
      await supabase
        .from("youtube_sync_logs")
        .update({
          status: "failed",
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    throw err;
  }
}

export async function syncCoursePlaylists(
  supabase: SupabaseClient,
  courseId: string,
  trigger: SyncTrigger = "manual"
): Promise<{
  courseId: string;
  chaptersSynced: number;
  results: PlaylistSyncResult[];
  errors: string[];
}> {
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, youtube_playlist_id, yt_sync_enabled")
    .eq("course_id", courseId)
    .not("youtube_playlist_id", "is", null)
    .eq("yt_sync_enabled", true);

  if (error) throw new Error(error.message);

  const results: PlaylistSyncResult[] = [];
  const errors: string[] = [];

  for (const chapter of chapters || []) {
    try {
      const result = await syncChapterFromPlaylist(supabase, chapter.id, {
        trigger,
        courseId,
      });
      results.push(result);
    } catch (err) {
      errors.push(
        `Chapter ${chapter.id}: ${err instanceof Error ? err.message : "sync failed"}`
      );
    }
  }

  return {
    courseId,
    chaptersSynced: results.length,
    results,
    errors,
  };
}

export async function syncAllEnabledPlaylists(
  supabase: SupabaseClient,
  trigger: SyncTrigger = "cron"
): Promise<{
  chaptersProcessed: number;
  results: PlaylistSyncResult[];
  errors: string[];
}> {
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, course_id")
    .not("youtube_playlist_id", "is", null)
    .eq("yt_sync_enabled", true);

  if (error) throw new Error(error.message);

  const results: PlaylistSyncResult[] = [];
  const errors: string[] = [];

  for (const chapter of chapters || []) {
    try {
      const result = await syncChapterFromPlaylist(supabase, chapter.id, {
        trigger,
        courseId: chapter.course_id,
      });
      results.push(result);
    } catch (err) {
      errors.push(
        `Chapter ${chapter.id}: ${err instanceof Error ? err.message : "sync failed"}`
      );
    }
  }

  return {
    chaptersProcessed: results.length,
    results,
    errors,
  };
}
