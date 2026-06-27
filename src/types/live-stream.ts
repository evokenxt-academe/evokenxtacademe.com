export type StreamStatus =
  | "scheduled"
  | "live"
  | "ended"
  | "cancelled"
  | "replay";

export type StreamVisibility = "public" | "unlisted" | "private";

export type StreamQuality =
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "1440p"
  | "2160p";

export type ChatMsgType =
  | "message"
  | "question"
  | "announcement"
  | "poll"
  | "system";

export type PipelineStepStatus = "pending" | "in_progress" | "done" | "error";

export type PollOption = {
  id: number;
  text: string;
  votes: number;
};

export type LiveStreamRow = {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  notes: string | null;
  status: StreamStatus;
  visibility: StreamVisibility;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  yt_broadcast_id: string | null;
  yt_stream_id: string | null;
  yt_video_id: string | null;
  yt_rtmp_url: string | null;
  yt_stream_key: string | null;
  yt_live_chat_id: string | null;
  yt_thumbnail_url: string | null;
  recording_url: string | null;
  max_quality: StreamQuality | null;
  category_id: number | null;
  enable_dvr: boolean;
  enable_chat: boolean;
  enable_embed: boolean;
  chat_moderation: boolean;
  concurrent_viewers: number;
  peak_viewers: number;
  total_chat_msgs: number;
  duration_sec: number | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

export type StreamAnalyticsSnapshot = {
  id: string;
  live_stream_id: string;
  snapshot_at: string;
  concurrent_viewers: number;
  chat_rate_per_min: number | null;
  yt_likes: number | null;
  yt_comments: number | null;
};

export type StreamRegistration = {
  id: string;
  live_stream_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  join_time: string | null;
  leave_time: string | null;
  watch_duration_sec: number;
  users?: {
    name: string | null;
    avatar: string | null;
    email: string | null;
  };
};

export type CourseOption = {
  id: string;
  title: string;
  programBody?: string;
  subjectCode?: string;
  subjectName?: string;
};

export type StreamListItem = {
  id: string;
  title: string;
  status: StreamStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  courseId: string;
  courseTitle: string;
  programBody: string;
  subjectCode: string;
  peakViewers: number;
  concurrentViewers: number;
  durationSec: number;
  ytVideoId: string | null;
  ytThumbnailUrl: string | null;
};

export type StreamListStats = {
  totalStreams: number;
  liveCount: number;
  scheduledThisWeek: number;
  totalWatchHours: number;
};
                                                                            