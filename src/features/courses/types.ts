// ─────────────────────────────────────────────────────────
// Course Feature — Domain Types
// Derived from database.types.ts but shaped for application use.
// ─────────────────────────────────────────────────────────

import type { Database } from "@/types/database.types";

// ── Row aliases ──────────────────────────────────────────

type Tables = Database["public"]["Tables"];

export type CourseRow = Tables["courses"]["Row"];
export type CourseInsert = Tables["courses"]["Insert"];
export type CourseUpdate = Tables["courses"]["Update"];

export type SectionRow = Tables["sections"]["Row"];
export type SectionInsert = Tables["sections"]["Insert"];
export type SectionUpdate = Tables["sections"]["Update"];

export type LectureRow = Tables["lectures"]["Row"];
export type LectureInsert = Tables["lectures"]["Insert"];
export type LectureUpdate = Tables["lectures"]["Update"];

export type ResourceRow = Tables["resources"]["Row"];
export type ResourceInsert = Tables["resources"]["Insert"];
export type ResourceUpdate = Tables["resources"]["Update"];

// ── Enums ────────────────────────────────────────────────

export type CourseLevel = CourseRow["level"];
export type CourseStatus = CourseRow["status"];

// ── Application-level composed types ────────────────────

/** Instructor information */
export interface Instructor {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phone: string | null;
  bio?: string | null;
}

/** A resource attached to a lecture. */
export interface Resource {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
}

/** A single lecture with its resources. */
export interface Lecture {
  id: string;
  section_id: string;
  title: string;
  video_url: string | null;
  description: string | null;
  duration_sec: number;
  position: number;
  is_preview: boolean;
  resources: Resource[];
}

/** A section with its lectures (and nested resources). */
export interface Section {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lectures: Lecture[];
}

/** Review / Rating */
export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Full course with relational tree. */
export interface CourseWithCurriculum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: CourseLevel;
  thumbnail_url: string | null;
  instructor_id: string;
  price: number;
  discount_price: number | null;
  status: CourseStatus;
  created_at: string;
  instructor?: Instructor | null;
  sections: Section[];
  reviews?: Review[];
}

export type Course = CourseWithCurriculum;

// ── Mutation payloads ───────────────────────────────────

export interface CreateCoursePayload {
  name: string;
  slug: string;
  description?: string | null;
  level?: CourseLevel;
  thumbnail_url?: string | null;
  instructor_id: string;
  price?: number;
  discount_price?: number | null;
  status?: CourseStatus;
}

export interface UpdateCoursePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  level?: CourseLevel;
  thumbnail_url?: string | null;
  instructor_id?: string;
  price?: number;
  discount_price?: number | null;
  status?: CourseStatus;
}

export interface AddSectionPayload {
  course_id: string;
  title: string;
  position: number;
}

export interface UpdateSectionPayload {
  title?: string;
  position?: number;
}

export interface AddLecturePayload {
  section_id: string;
  title: string;
  position: number;
  video_url?: string | null;
  description?: string | null;
  duration_sec?: number;
  is_preview?: boolean;
}

export interface UpdateLecturePayload {
  title?: string;
  video_url?: string | null;
  description?: string | null;
  duration_sec?: number;
  position?: number;
  is_preview?: boolean;
}

export interface AddResourcePayload {
  lecture_id: string;
  title: string;
  file_url: string;
}

/** Used for batch position updates (reorder). */
export interface PositionUpdate {
  id: string;
  position: number;
}
