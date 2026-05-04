/**
 * Courses Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for courses, chapters, lectures, and study materials
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  Course,
  Chapter,
  Lecture,
  LectureResource,
  StudyMaterial,
  User,
  Subject,
  ProgramLevel,
  Program,
  CoursePricing,
  PaymentPlan,
  Review,
  CourseWithHierarchy,
  CourseWithContent,
  CourseWithPricing,
  CourseDetails,
  PublishStatus,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/courses] ${scope}: ${msg}`);
  return msg;
}

// ─── Catalog Course Types ──────────────────────────────────────────

export interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  thumbnail_url: string | null;
  language: string;
  status: PublishStatus;
  is_featured: boolean;
  total_students: number;
  avg_rating: number;
  created_at: string;
  instructor: Pick<User, "id" | "name" | "avatar">;
  subject: Subject & {
    program_level: ProgramLevel & {
      program: Program;
    };
  };
  pricing: CoursePricing[];
  reviews_count: number;
}

// ─── Course Queries ────────────────────────────────────────────────

/**
 * Fetch all published courses for the catalog page
 */
export async function getPublishedCourses(
  supabase: SupabaseClient<Database>,
  options?: {
    subjectId?: string;
    programId?: string;
    levelId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<QueryResult<CatalogCourse[]>> {
  let query = supabase
    .from("courses")
    .select(`
      id, slug, title, short_description, thumbnail_url, language,
      status, is_featured, total_students, avg_rating, created_at,
      instructor:users!instructor_id(id, name, avatar),
      subject:subjects!subject_id(
        *,
        program_level:program_levels!program_level_id(
          *,
          program:programs!program_id(*)
        )
      ),
      pricing:course_pricing!course_id(*),
      reviews(id)
    `)
    .eq("status", "published");

  if (options?.subjectId) {
    query = query.eq("subject_id", options.subjectId);
  }
  if (options?.featured !== undefined) {
    query = query.eq("is_featured", options.featured);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  const errMsg = handleError("getPublishedCourses", error);
  if (errMsg) return { data: null, error: errMsg };

  // Transform reviews to count
  const transformed = (data ?? []).map((course) => ({
    ...course,
    reviews_count: Array.isArray(course.reviews) ? course.reviews.length : 0,
  }));

  // Filter by program/level if specified (requires post-query filtering)
  let filtered = transformed;
  if (options?.programId) {
    filtered = filtered.filter(
      (c) => c.subject?.program_level?.program?.id === options.programId
    );
  }
  if (options?.levelId) {
    filtered = filtered.filter(
      (c) => c.subject?.program_level?.id === options.levelId
    );
  }

  return { data: filtered as unknown as CatalogCourse[], error: null };
}

/**
 * Fetch a single course by slug with full details
 */
export async function getCourseBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<QueryResult<CourseDetails>> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:users!instructor_id(id, name, avatar),
      subject:subjects!subject_id(
        *,
        program_level:program_levels!program_level_id(
          *,
          program:programs!program_id(*)
        )
      ),
      chapters:chapters!course_id(
        *,
        lectures:lectures!chapter_id(
          *,
          resources:lecture_resources!lecture_id(*)
        )
      ),
      pricing:course_pricing!course_id(
        *,
        payment_plans:payment_plans!pricing_id(*)
      ),
      study_materials:study_materials!course_id(*),
      reviews:reviews!course_id(
        *,
        user:users!user_id(id, name, avatar)
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  const errMsg = handleError("getCourseBySlug", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!data) return { data: null, error: null };

  // Sort chapters, lectures, and resources by position
  const sorted = {
    ...data,
    chapters: (data.chapters ?? [])
      .filter((ch: Chapter) => ch.is_published)
      .sort((a: Chapter, b: Chapter) => a.position - b.position)
      .map((chapter: Chapter & { lectures: (Lecture & { resources: LectureResource[] })[] }) => ({
        ...chapter,
        lectures: (chapter.lectures ?? [])
          .filter((l: Lecture) => l.is_published)
          .sort((a: Lecture, b: Lecture) => a.position - b.position)
          .map((lecture) => ({
            ...lecture,
            resources: (lecture.resources ?? []).sort(
              (a: LectureResource, b: LectureResource) => a.position - b.position
            ),
          })),
      })),
    pricing: (data.pricing ?? [])
      .filter((p: CoursePricing) => p.is_active)
      .map((pricing: CoursePricing & { payment_plans: PaymentPlan[] }) => ({
        ...pricing,
        payment_plans: (pricing.payment_plans ?? []).filter((pl: PaymentPlan) => pl.is_active),
      })),
    study_materials: (data.study_materials ?? [])
      .filter((m: StudyMaterial) => m.is_published)
      .sort((a: StudyMaterial, b: StudyMaterial) => a.position - b.position),
    reviews: (data.reviews ?? []).filter((r: Review) => r.is_approved),
  };

  return { data: sorted as unknown as CourseDetails, error: null };
}

/**
 * Fetch a course by ID
 */
export async function getCourseById(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<CourseWithHierarchy>> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:users!instructor_id(id, name, avatar),
      subject:subjects!subject_id(
        *,
        program_level:program_levels!program_level_id(
          *,
          program:programs!program_id(*)
        )
      )
    `)
    .eq("id", courseId)
    .maybeSingle();

  const errMsg = handleError("getCourseById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as CourseWithHierarchy, error: null };
}

/**
 * Fetch courses for a subject
 */
export async function getCoursesBySubject(
  supabase: SupabaseClient<Database>,
  subjectId: string
): Promise<QueryResult<CatalogCourse[]>> {
  return getPublishedCourses(supabase, { subjectId });
}

/**
 * Fetch featured courses
 */
export async function getFeaturedCourses(
  supabase: SupabaseClient<Database>,
  limit = 6
): Promise<QueryResult<CatalogCourse[]>> {
  return getPublishedCourses(supabase, { featured: true, limit });
}

// ─── Chapter & Lecture Queries ─────────────────────────────────────

/**
 * Fetch chapters with lectures for a course
 */
export async function getCourseContent(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<CourseWithContent["chapters"]>> {
  const { data, error } = await supabase
    .from("chapters")
    .select(`
      *,
      lectures:lectures!chapter_id(*)
    `)
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("position", { ascending: true });

  const errMsg = handleError("getCourseContent", error);
  if (errMsg) return { data: null, error: errMsg };

  // Sort lectures within each chapter
  const sorted = (data ?? []).map((chapter) => ({
    ...chapter,
    lectures: (chapter.lectures ?? [])
      .filter((l: Lecture) => l.is_published)
      .sort((a: Lecture, b: Lecture) => a.position - b.position),
  }));

  return { data: sorted as unknown as CourseWithContent["chapters"], error: null };
}

/**
 * Fetch a single lecture by ID with resources
 */
export async function getLectureById(
  supabase: SupabaseClient<Database>,
  lectureId: string
): Promise<QueryResult<Lecture & { resources: LectureResource[]; chapter: Chapter }>> {
  const { data, error } = await supabase
    .from("lectures")
    .select(`
      *,
      resources:lecture_resources!lecture_id(*),
      chapter:chapters!chapter_id(*)
    `)
    .eq("id", lectureId)
    .maybeSingle();

  const errMsg = handleError("getLectureById", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!data) return { data: null, error: null };

  // Sort resources by position
  const sorted = {
    ...data,
    resources: (data.resources ?? []).sort(
      (a: LectureResource, b: LectureResource) => a.position - b.position
    ),
  };

  return { data: sorted as unknown as Lecture & { resources: LectureResource[]; chapter: Chapter }, error: null };
}

/**
 * Fetch preview lectures for a course (free access)
 */
export async function getPreviewLectures(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<Lecture[]>> {
  const { data, error } = await supabase
    .from("lectures")
    .select(`
      *,
      chapter:chapters!chapter_id(course_id)
    `)
    .eq("is_preview", true)
    .eq("is_published", true);

  const errMsg = handleError("getPreviewLectures", error);
  if (errMsg) return { data: null, error: errMsg };

  // Filter by course_id (lectures are linked via chapters)
  const filtered = (data ?? []).filter(
    (lecture) => lecture.chapter?.course_id === courseId
  );

  return { data: filtered as unknown as Lecture[], error: null };
}

// ─── Study Materials Queries ───────────────────────────────────────

/**
 * Fetch study materials for a course
 */
export async function getCourseStudyMaterials(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<StudyMaterial[]>> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("position", { ascending: true });

  const errMsg = handleError("getCourseStudyMaterials", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch study materials for a chapter
 */
export async function getChapterStudyMaterials(
  supabase: SupabaseClient<Database>,
  chapterId: string
): Promise<QueryResult<StudyMaterial[]>> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("is_published", true)
    .order("position", { ascending: true });

  const errMsg = handleError("getChapterStudyMaterials", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

// ─── Pricing Queries ───────────────────────────────────────────────

/**
 * Fetch pricing options for a course
 */
export async function getCoursePricing(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<CourseWithPricing["pricing"]>> {
  const { data, error } = await supabase
    .from("course_pricing")
    .select(`
      *,
      payment_plans:payment_plans!pricing_id(*)
    `)
    .eq("course_id", courseId)
    .eq("is_active", true);

  const errMsg = handleError("getCoursePricing", error);
  if (errMsg) return { data: null, error: errMsg };

  // Filter active payment plans
  const filtered = (data ?? []).map((pricing) => ({
    ...pricing,
    payment_plans: (pricing.payment_plans ?? []).filter((pl: PaymentPlan) => pl.is_active),
  }));

  return { data: filtered as unknown as CourseWithPricing["pricing"], error: null };
}

// ─── Review Queries ────────────────────────────────────────────────

/**
 * Fetch approved reviews for a course
 */
export async function getCourseReviews(
  supabase: SupabaseClient<Database>,
  courseId: string,
  limit = 10
): Promise<QueryResult<(Review & { user: Pick<User, "id" | "name" | "avatar"> })[]>> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      user:users!user_id(id, name, avatar)
    `)
    .eq("course_id", courseId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  const errMsg = handleError("getCourseReviews", error);
  if (errMsg) return { data: null, error: errMsg };

  return {
    data: data as unknown as (Review & { user: Pick<User, "id" | "name" | "avatar"> })[],
    error: null,
  };
}

// ─── Search Queries ────────────────────────────────────────────────

/**
 * Search courses by title (uses trigram index)
 */
export async function searchCourses(
  supabase: SupabaseClient<Database>,
  searchTerm: string,
  limit = 10
): Promise<QueryResult<CatalogCourse[]>> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id, slug, title, short_description, thumbnail_url, language,
      status, is_featured, total_students, avg_rating, created_at,
      instructor:users!instructor_id(id, name, avatar),
      subject:subjects!subject_id(
        *,
        program_level:program_levels!program_level_id(
          *,
          program:programs!program_id(*)
        )
      ),
      pricing:course_pricing!course_id(*),
      reviews(id)
    `)
    .eq("status", "published")
    .ilike("title", `%${searchTerm}%`)
    .limit(limit);

  const errMsg = handleError("searchCourses", error);
  if (errMsg) return { data: null, error: errMsg };

  const transformed = (data ?? []).map((course) => ({
    ...course,
    reviews_count: Array.isArray(course.reviews) ? course.reviews.length : 0,
  }));

  return { data: transformed as unknown as CatalogCourse[], error: null };
}

// ─── Instructor Queries ────────────────────────────────────────────

/**
 * Fetch courses by instructor
 */
export async function getCoursesByInstructor(
  supabase: SupabaseClient<Database>,
  instructorId: string,
  includeUnpublished = false
): Promise<QueryResult<Course[]>> {
  let query = supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;

  const errMsg = handleError("getCoursesByInstructor", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Compute average rating from a reviews array */
export function computeAverageRating(reviews: Array<{ rating: number }>): number | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Format price in currency */
export function formatPrice(amount: number, currency = "INR"): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Calculate total course duration from lectures */
export function calculateCourseDuration(
  chapters: Array<{ lectures: Array<{ duration_sec: number }> }>
): number {
  return chapters.reduce(
    (total, chapter) =>
      total +
      chapter.lectures.reduce((chTotal, lecture) => chTotal + lecture.duration_sec, 0),
    0
  );
}

/** Format seconds into a compact duration string */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

/** Count total lectures in a course */
export function countLectures(chapters: Array<{ lectures: Array<unknown> }>): number {
  return chapters.reduce((total, chapter) => total + chapter.lectures.length, 0);
}
