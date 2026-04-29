// ─── Learning Page Types ───────────────────────────────────────────
import type {
  CourseRow,
  SectionRow,
  LectureRow,
  LectureProgressRow,
} from "@/types/database.types";

/** Resource attached to a lecture */
export interface LectureResource {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
}

/** Lecture with nested resources */
export interface LectureWithResources extends LectureRow {
  resources: LectureResource[];
}

/** Section with nested lectures + resources */
export interface SectionWithLectures extends SectionRow {
  lectures: LectureWithResources[];
}

/** Full course content used by the learn page */
export interface CourseContent extends CourseRow {
  sections: SectionWithLectures[];
}

/** Flat lecture reference for ordered navigation */
export interface FlatLecture {
  id: string;
  title: string;
  video_url: string | null;
  duration_sec: number;
  sectionId: string;
  sectionTitle: string;
  index: number; // global index across all sections
}

/** Player state managed by the video player */
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isBuffering: boolean;
  isReady: boolean;
  hasError: boolean;
}

/** Progress update payload */
export interface ProgressPayload {
  user_id: string;
  lecture_id: string;
  watched_seconds: number;
  is_completed: boolean;
  last_watched_at: string;
}

/** Progress map: lecture_id → progress data */
export type ProgressMap = Record<
  string,
  Pick<LectureProgressRow, "is_completed" | "watched_seconds" | "last_watched_at">
>;

/** Playback speed options */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
