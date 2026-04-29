// ─────────────────────────────────────────────────────────
// My Courses — Types
// Database + UI types for enrolled courses
// ─────────────────────────────────────────────────────────

import type { Database } from "@/types/database.types";

// ── Row aliases ──────────────────────────────────────────

type Tables = Database["public"]["Tables"];

export type EnrollmentRow = Tables["enrollments"]["Row"];
export type CourseRow = Tables["courses"]["Row"];
export type SectionRow = Tables["sections"]["Row"];
export type LectureRow = Tables["lectures"]["Row"];
export type LectureProgressRow = Tables["lecture_progress"]["Row"];
export type UserRow = Tables["users"]["Row"];

// ── Enrollment query shape ───────────────────────────────

export interface EnrollmentWithCourse extends EnrollmentRow {
    course: CourseRow & {
        instructor: Pick<UserRow, "name" | "avatar"> | null;
        sections: Array<
            SectionRow & {
                lectures: Array<
                    Pick<LectureRow, "id"> & {
                        lecture_progress: Array<
                            Pick<LectureProgressRow, "user_id" | "is_completed" | "last_watched_at">
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
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    lastAccessedAt: string | null;
}
