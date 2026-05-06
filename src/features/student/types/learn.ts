// ─── Course Learning Page Types (Supabase v2.1.0) ───────────────────

import type { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];
export type CourseRow = Tables["courses"]["Row"];
export type ChapterRow = Tables["chapters"]["Row"];
export type LectureRow = Tables["lectures"]["Row"];
export type LectureResourceRow = Tables["lecture_resources"]["Row"];
export type LectureProgressRow = Tables["lecture_progress"]["Row"];
export type QuizRow = Tables["quizzes"]["Row"];

/** A lecture with its nested resources */
export interface LectureWithResources
  extends Pick<
    LectureRow,
    | "id"
    | "title"
    | "description"
    | "duration_sec"
    | "yt_video_id"
    | "video_provider"
    | "position"
    | "is_preview"
  > {
  resources: Array<
    Pick<
      LectureResourceRow,
      "id" | "lecture_id" | "title" | "file_url" | "file_type" | "file_size_kb" | "position"
    >
  >;
}

/** A chapter with its nested lectures (and their resources) */
export interface ChapterWithLectures extends Pick<ChapterRow, "id" | "title" | "position"> {
  lectures: LectureWithResources[];
}

/** The full course payload with nested chapters → lectures → resources */
export interface CourseWithContent
  extends Pick<CourseRow, "id" | "title" | "slug" | "description" | "thumbnail_url" | "language"> {
  chapters: ChapterWithLectures[];
}

export interface CourseQuizOverview
  extends Pick<
    QuizRow,
    | "id"
    | "title"
    | "type"
    | "chapter_id"
    | "time_limit_sec"
    | "passing_marks"
    | "total_marks"
  > {
  question_count: number;
  best_score: number | null;
  last_attempted: string | null;
}

/** Progress record for a single lecture */
export interface LectureProgressRecord {
  lecture_id: string;
  is_completed: boolean;
  watched_seconds: number;
  resume_at_seconds: number;
  last_watched_at: string | null;
}

/** A map of lecture_id → progress record for O(1) lookup */
export type ProgressMap = Map<string, LectureProgressRecord>;

/** Flattened ordered list of all lectures for prev/next navigation */
export interface FlatLecture {
  chapterIndex: number;
  lectureIndex: number;
  chapterId: string;
  chapterTitle: string;
  lecture: LectureWithResources;
}
