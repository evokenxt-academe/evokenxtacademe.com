import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CourseLevel } from "@/types/database.types";

// ─── Shared result type helpers ────────────────────────────────────

type SupabaseResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries] ${scope}: ${msg}`);
  return msg;
}

// ─── Catalog Course type (with joined instructor + reviews) ───────

export interface CatalogCourseInstructor {
  name: string | null;
  avatar: string | null;
}

export interface CatalogCourse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  level: CourseLevel;
  thumbnail_url: string | null;
  price: number;
  discount_price: number | null;
  status: string;
  created_at: string;
  instructor: CatalogCourseInstructor | null;
  reviews: Array<{ rating: number }>;
  sections: Array<{ id: string }>;
}

// ─── Course Catalog Queries ────────────────────────────────────────

/**
 * Fetch all published courses with instructor info and review ratings.
 * Used by the public /courses catalog page.
 */
export async function getPublishedCourses(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseResult<CatalogCourse[]>> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, slug, name:title, description, thumbnail_url, status, created_at,
       instructor:users!instructor_id(name, avatar),
       reviews(rating),
       subject:subjects!inner(
         id,
         program_level:program_levels!inner(label, program:programs(body))
       ),
       pricing:course_pricing(base_price, discounted_price, is_active),
       chapters(id)`
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const errMsg = handleError("getPublishedCourses", error);
  if (errMsg) return { data: null, error: errMsg };

  const deriveLevel = (label?: string | null): CourseLevel => {
    switch (label) {
      case "Applied Knowledge":
      case "Level I":
      case "Part 1":
        return "knowledge";
      case "Applied Skills":
      case "Level II":
        return "skills";
      case "Strategic Professional":
      case "Level III":
      case "Part 2":
        return "professional";
      default:
        return "professional";
    }
  };

  const mapped = (data ?? []).map((course: any) => {
    const activePricing = (course.pricing ?? []).find((tier: any) => tier?.is_active);
    return {
      ...course,
      level: deriveLevel(course.subject?.program_level?.label),
      price: activePricing?.discounted_price ?? activePricing?.base_price ?? 0,
      discount_price: activePricing?.discounted_price ?? null,
      sections: (course.chapters ?? []).map((chapter: any) => ({ id: chapter.id })),
    };
  });

  return { data: mapped as unknown as CatalogCourse[], error: null };
}

/**
 * Fetch a single course by slug with full details.
 */
export async function getCourseBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<SupabaseResult<CatalogCourse>> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, slug, name:title, description, level, thumbnail_url, price, discount_price, status, created_at,
       instructor:users!instructor_id(name, avatar),
       reviews(rating),
       sections(id)`
    )
    .eq("slug", slug)
    .maybeSingle();

  const errMsg = handleError("getCourseBySlug", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as CatalogCourse | null, error: null };
}

// ─── Dashboard Queries ─────────────────────────────────────────────

export interface DashboardEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
  course: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    level: string;
    thumbnail_url: string | null;
    price: number;
    discount_price: number | null;
    instructor: CatalogCourseInstructor | null;
  };
}

/**
 * Fetch active enrollments for a student with course + instructor data.
 */
export async function getStudentEnrollments(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SupabaseResult<DashboardEnrollment[]>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, user_id, course_id, status, enrolled_at, expires_at,
        course:courses(
          id, name:title, slug, description, level, thumbnail_url, price, discount_price,
         instructor:users!instructor_id(name, avatar)
       )`
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });

  const errMsg = handleError("getStudentEnrollments", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: (data ?? []) as unknown as DashboardEnrollment[], error: null };
}

/**
 * Fetch lecture progress for a set of lecture IDs belonging to a student.
 */
export async function getLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureIds: string[],
) {
  if (lectureIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("lecture_progress")
    .select("lecture_id, is_completed, watched_seconds, last_watched_at")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  const errMsg = handleError("getLectureProgress", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch sections and nested lectures for given course IDs.
 */
export async function getSectionsWithLectures(
  supabase: SupabaseClient<Database>,
  courseIds: string[],
) {
  if (courseIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("sections")
    .select(
      `id, course_id, title, position,
       lectures(id, section_id, title, video_url, description, duration_sec, position, is_preview)`
    )
    .in("course_id", courseIds)
    .order("position", { ascending: true });

  const errMsg = handleError("getSectionsWithLectures", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch certificates earned by a student.
 */
export async function getStudentCertificates(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("certificates")
    .select(
      `id, cert_url, issued_at,
      course:courses(id, name:title, slug, thumbnail_url)`
    )
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  const errMsg = handleError("getStudentCertificates", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch upcoming/live streams for the courses the student is enrolled in.
 */
export async function getUpcomingStreams(
  supabase: SupabaseClient<Database>,
  courseIds: string[],
) {
  if (courseIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("live_streams")
    .select(
      `id, title, course_id, status, scheduled_at, started_at, ended_at, yt_video_id`
    )
    .in("course_id", courseIds)
    .in("status", ["scheduled", "live"])
    .order("scheduled_at", { ascending: true })
    .limit(8);

  const errMsg = handleError("getUpcomingStreams", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch recent lecture activity for a student.
 */
export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 5,
) {
  const { data, error } = await supabase
    .from("lecture_progress")
    .select(
      `lecture_id, is_completed, watched_seconds, last_watched_at,
       lecture:lectures(id, title, duration_sec,
         section:sections(id, title, course_id,
           course:courses(id, name:title, slug)
         )
       )`
    )
    .eq("user_id", userId)
    .not("last_watched_at", "is", null)
    .order("last_watched_at", { ascending: false })
    .limit(limit);

  const errMsg = handleError("getRecentActivity", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Compute average rating from a reviews array. Returns null if no reviews. */
export function computeAverageRating(reviews: Array<{ rating: number }>): number | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Format price in INR */
export function formatPriceINR(amount: number): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format seconds into a compact duration string (e.g. "12h 30m") */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}
