/**
 * Course Detail — Public Page Queries
 * ====================================
 * All Supabase queries for /courses/[slug] page.
 * Server-side uses createServerClient_(), client-side uses createClient().
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────

export interface CourseDetailData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  what_you_learn: string[] | null;
  requirements: string[] | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  language: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  avg_rating: number;
  total_students: number;
  subject_name: string;
  subject_code: string;
  level_label: string;
  program_body: string;
  instructor_name: string;
  instructor_avatar: string | null;
  base_price: number | null;
  discounted_price: number | null;
  currency: string;
  pricing_label: string | null;
}

export interface ChapterWithLectures {
  id: string;
  title: string;
  position: number;
  is_published: boolean;
  lectures: LectureRow[];
}

export interface LectureRow {
  lecture_id: string;
  lecture_title: string;
  duration_sec: number;
  lecture_position: number;
  is_preview: boolean;
  lecture_published: boolean;
  yt_video_id: string | null;
}

export interface ReviewRow {
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

export interface EnrollmentRow {
  id: string;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
}

// ── Utility Functions ────────────────────────────────────

/** Format seconds to "1h 24m" or "45m" or "2m 30s" */
export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0m";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/** Format seconds to "mm:ss" */
export function formatLectureDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Stars display (filled/empty) "★★★★☆" style */
export function renderStars(rating: number): string {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

// ── Queries ──────────────────────────────────────────────

/**
 * Fetch course by slug with all joined data (subject, level, program, instructor, pricing).
 */
export async function fetchCourseBySlugDetail(
  supabase: SupabaseClient<any>,
  slug: string
): Promise<CourseDetailData | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, title, slug, description, short_description,
       what_you_learn, requirements, thumbnail_url, preview_video_url,
       language, status, is_featured, avg_rating, total_students,
       subject:subjects!inner(
         name, code,
         program_level:program_levels!inner(
           label,
           program:programs!inner(body)
         )
       ),
       instructor:users!instructor_id(name, avatar),
       pricing:course_pricing(base_price, discounted_price, currency, label, is_active)`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[course-detail] fetchCourseBySlugDetail:", error.message);
    return null;
  }

  if (!data) return null;

  const raw = data as any;

  // Find cheapest active pricing
  const activePricing = (raw.pricing ?? [])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => {
      const priceA = a.discounted_price ?? a.base_price ?? Infinity;
      const priceB = b.discounted_price ?? b.base_price ?? Infinity;
      return priceA - priceB;
    })[0];

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    short_description: raw.short_description,
    what_you_learn: raw.what_you_learn,
    requirements: raw.requirements,
    thumbnail_url: raw.thumbnail_url,
    preview_video_url: raw.preview_video_url,
    language: raw.language ?? "English",
    status: raw.status,
    is_featured: raw.is_featured ?? false,
    avg_rating: raw.avg_rating ?? 0,
    total_students: raw.total_students ?? 0,
    subject_name: raw.subject?.name ?? "",
    subject_code: raw.subject?.code ?? "",
    level_label: raw.subject?.program_level?.label ?? "",
    program_body: raw.subject?.program_level?.program?.body ?? "",
    instructor_name: raw.instructor?.name ?? "Instructor",
    instructor_avatar: raw.instructor?.avatar ?? null,
    base_price: activePricing?.base_price ?? null,
    discounted_price: activePricing?.discounted_price ?? null,
    currency: activePricing?.currency ?? "USD",
    pricing_label: activePricing?.label ?? null,
  };
}

export async function fetchChaptersWithLectures(
  supabase: SupabaseClient<any>,
  courseId: string
): Promise<ChapterWithLectures[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select(
      `id, title, position, is_published,
       lectures(
         id, title, duration_sec, position, is_preview, is_published, yt_video_id
       )`
    )
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[course-detail] fetchChaptersWithLectures:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((ch: any) => ch.is_published !== false) // Handle null as published
    .map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      position: ch.position,
      is_published: ch.is_published,
      lectures: (ch.lectures ?? [])
        .filter((l: any) => l.is_published !== false)
        .sort((a: any, b: any) => a.position - b.position)
        .map((l: any) => ({
          lecture_id: l.id,
          lecture_title: l.title,
          duration_sec: l.duration_sec ?? 0,
          lecture_position: l.position,
          is_preview: l.is_preview ?? false,
          lecture_published: l.is_published ?? true,
          yt_video_id: l.yt_video_id ?? null,
        })),
    }));
}

/**
 * Fetch approved reviews for a course.
 */
export async function fetchCourseReviews(
  supabase: SupabaseClient<any>,
  courseId: string,
  limit = 10
): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `rating, comment, created_at,
       user:users!inner(name, avatar)`
    )
    .eq("course_id", courseId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[course-detail] fetchCourseReviews:", error.message);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: r.user?.name ?? "Student",
    reviewer_avatar: r.user?.avatar ?? null,
  }));
}

/**
 * Check if the current user is enrolled in a course (client-side only).
 */
export async function fetchEnrollmentStatus(
  supabase: SupabaseClient<any>,
  courseId: string
): Promise<EnrollmentRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, expires_at")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[course-detail] fetchEnrollmentStatus:", error.message);
    return null;
  }

  return data as EnrollmentRow | null;
}
