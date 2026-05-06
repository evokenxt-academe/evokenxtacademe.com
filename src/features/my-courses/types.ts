// ─────────────────────────────────────────────────────────
// My Courses — Types
// Database + UI types for enrolled courses with progress
// ─────────────────────────────────────────────────────────

import type { Database } from "@/types/database.types";

// ── Row aliases ──────────────────────────────────────────

type Tables = Database["public"]["Tables"];

export type EnrollmentRow = Tables["enrollments"]["Row"];
export type CourseRow = Tables["courses"]["Row"];
export type ChapterRow = Tables["chapters"]["Row"];
export type LectureRow = Tables["lectures"]["Row"];
export type LectureProgressRow = Tables["lecture_progress"]["Row"];
export type UserRow = Tables["users"]["Row"];

// ── Enrollment query shape (Supabase relational) ────────

export interface EnrollmentWithCourse extends EnrollmentRow {
  course: CourseRow & {
    instructor: Pick<UserRow, "name" | "avatar"> | null;
    chapters: Array<
      ChapterRow & {
        lectures: Array<
          Pick<LectureRow, "id" | "title" | "duration_sec" | "position"> & {
            lecture_progress: Array<
              Pick<
                LectureProgressRow,
                "user_id" | "is_completed" | "watched_seconds" | "last_watched_at"
              >
            >;
          }
        >;
      }
    >;
  };
}

// ── UI model ─────────────────────────────────────────────

export interface MyCourse {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  instructorName: string;
  instructorAvatar: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalDurationSec: number;
  watchedSec: number;
  lastAccessedAt: string | null;
  resumeLectureId: string | null;
  resumeLectureTitle: string | null;
  isCompleted: boolean;
}
