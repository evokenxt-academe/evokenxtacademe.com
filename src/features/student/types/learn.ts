// ─── Course Learning Page Types ────────────────────────────────────

import type {
  CourseRow,
  SectionRow,
  LectureRow,
  LectureProgressRow,
} from "@/types/database.types";

/** A lecture with its nested resources */
export interface LectureWithResources extends LectureRow {
  resources: ResourceRow[];
}

/** A section with its nested lectures (and their resources) */
export interface SectionWithLectures extends SectionRow {
  lectures: LectureWithResources[];
}

/** The full course payload with nested sections → lectures → resources */
export interface CourseWithContent extends CourseRow {
  sections: SectionWithLectures[];
}

/** Minimal resource row */
export interface ResourceRow {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
}

/** Progress record for a single lecture */
export interface LectureProgressRecord {
  lecture_id: string;
  is_completed: boolean;
  watched_seconds: number;
  last_watched_at: string | null;
}

/** A map of lecture_id → progress record for O(1) lookup */
export type ProgressMap = Map<string, LectureProgressRecord>;

/** Flattened ordered list of all lectures for prev/next navigation */
export interface FlatLecture {
  sectionIndex: number;
  lectureIndex: number;
  sectionId: string;
  sectionTitle: string;
  lecture: LectureWithResources;
}
