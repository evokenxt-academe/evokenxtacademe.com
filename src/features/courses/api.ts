/**
 * Course API Layer
 *
 * All Supabase operations for courses, sections, lectures, and resources.
 * Uses the browser client for client-side queries.
 * Every function returns a typed result or throws with a descriptive error.
 */

import { createClient } from "@/utils/supabase/client";
import type { CatalogCourse } from "@/lib/supabase/queries";
import type {
  CourseWithCurriculum,
  CourseRow,
  SectionRow,
  LectureRow,
  ResourceRow,
  CreateCoursePayload,
  UpdateCoursePayload,
  AddSectionPayload,
  UpdateSectionPayload,
  AddLecturePayload,
  UpdateLecturePayload,
  AddResourcePayload,
  PositionUpdate,
  Section,
  Lecture,
  Resource,
  Instructor,
  Review,
} from "./types";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function getClient() {
  return createClient();
}

/**
 * Fetch published catalog courses for the public LMS courses page.
 */
export async function fetchPublishedCatalogCourses(): Promise<CatalogCourse[]> {
  const supabase = getClient();

  const result = await supabase
    .from("courses")
    .select(
      `id, slug, name, description, level, thumbnail_url, price, discount_price, status, created_at,
       instructor:users!instructor_id(name, avatar),
       reviews(rating),
       sections(id)`
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return throwIfError(
    result as {
      data: CatalogCourse[] | null;
      error: { message: string } | null;
    },
    "fetchPublishedCatalogCourses"
  );
}

/** Throw a descriptive error if a Supabase call fails. */
function throwIfError<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string
): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${context}: no data returned`);
  }
  return result.data;
}

// ─────────────────────────────────────────────────────────
// COURSE — READ
// ─────────────────────────────────────────────────────────

/**
 * Fetch a single course with its full curriculum tree.
 * Uses a nested select to minimize round-trips.
 * Includes: instructor, sections → lectures → resources, reviews
 */
export async function fetchCourseWithCurriculum(
  courseId: string
): Promise<CourseWithCurriculum> {
  const supabase = getClient();

  // Supabase supports nested selects through foreign key relations.
  // courses → sections (via course_id) → lectures (via section_id) → resources (via lecture_id)
  // Also fetch instructor and reviews
  const result = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:users!instructor_id(*),
      sections (
        *,
        lectures (
          *,
          resources (*)
        )
      ),
      reviews (*)
    `
    )
    .eq("id", courseId)
    .order("position", { referencedTable: "sections", ascending: true })
    .single();

  const raw = throwIfError(result, "fetchCourseWithCurriculum");

  // Sort nested arrays (Supabase nested ordering is limited)
  const sections: Section[] = ((raw as any).sections ?? [])
    .sort((a: SectionRow, b: SectionRow) => a.position - b.position)
    .map((s: any) => ({
      ...s,
      lectures: (s.lectures ?? [])
        .sort((a: LectureRow, b: LectureRow) => a.position - b.position)
        .map((l: any) => ({
          ...l,
          resources: l.resources ?? [],
        })),
    }));

  return { ...(raw as any), sections } as CourseWithCurriculum;
}

/**
 * Fetch a course by its slug.
 * Includes: instructor, sections → lectures → resources, reviews
 */
export async function fetchCourseBySlug(
  slug: string
): Promise<CourseWithCurriculum> {
  const supabase = getClient();

  const result = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:users!instructor_id(*),
      sections (
        *,
        lectures (
          *,
          resources (*)
        )
      ),
      reviews (*)
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .order("position", { referencedTable: "sections", ascending: true })
    .single();

  const raw = throwIfError(result, "fetchCourseBySlug");

  const sections: Section[] = ((raw as any).sections ?? [])
    .sort((a: SectionRow, b: SectionRow) => a.position - b.position)
    .map((s: any) => ({
      ...s,
      lectures: (s.lectures ?? [])
        .sort((a: LectureRow, b: LectureRow) => a.position - b.position)
        .map((l: any) => ({
          ...l,
          resources: l.resources ?? [],
        })),
    }));

  return { ...(raw as any), sections } as CourseWithCurriculum;
}

/**
 * Fetch a list of all courses (without nested curriculum).
 */
export async function fetchCourses(): Promise<CourseRow[]> {
  const supabase = getClient();

  const result = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return throwIfError(result, "fetchCourses");
}

// ─────────────────────────────────────────────────────────
// COURSE — CREATE / UPDATE / DELETE
// ─────────────────────────────────────────────────────────

export async function createCourse(
  payload: CreateCoursePayload
): Promise<CourseRow> {
  const supabase = getClient();

  const result = await supabase
    .from("courses")
    .insert(payload)
    .select()
    .single();

  return throwIfError(result, "createCourse");
}

export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload
): Promise<CourseRow> {
  const supabase = getClient();

  const result = await supabase
    .from("courses")
    .update(payload)
    .eq("id", courseId)
    .select()
    .single();

  return throwIfError(result, "updateCourse");
}

export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = getClient();

  // Must delete in order: resources → lectures → sections → course
  // (respecting foreign key constraints)

  // 1. Get all section IDs for this course
  const sectionsResult = await supabase
    .from("sections")
    .select("id")
    .eq("course_id", courseId);

  const sectionIds = (sectionsResult.data ?? []).map((s) => s.id);

  if (sectionIds.length > 0) {
    // 2. Get all lecture IDs for these sections
    const lecturesResult = await supabase
      .from("lectures")
      .select("id")
      .in("section_id", sectionIds);

    const lectureIds = (lecturesResult.data ?? []).map((l) => l.id);

    // 3. Delete resources
    if (lectureIds.length > 0) {
      const { error: resError } = await supabase
        .from("resources")
        .delete()
        .in("lecture_id", lectureIds);
      if (resError) throw new Error(`Delete resources: ${resError.message}`);
    }

    // 4. Delete lectures
    const { error: lecError } = await supabase
      .from("lectures")
      .delete()
      .in("section_id", sectionIds);
    if (lecError) throw new Error(`Delete lectures: ${lecError.message}`);

    // 5. Delete sections
    const { error: secError } = await supabase
      .from("sections")
      .delete()
      .eq("course_id", courseId);
    if (secError) throw new Error(`Delete sections: ${secError.message}`);
  }

  // 6. Delete course
  const { error: courseError } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);
  if (courseError) throw new Error(`Delete course: ${courseError.message}`);
}

// ─────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────

export async function fetchSections(courseId: string): Promise<SectionRow[]> {
  const supabase = getClient();

  const result = await supabase
    .from("sections")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  return throwIfError(result, "fetchSections");
}

export async function addSection(
  payload: AddSectionPayload
): Promise<SectionRow> {
  const supabase = getClient();

  const result = await supabase
    .from("sections")
    .insert(payload)
    .select()
    .single();

  return throwIfError(result, "addSection");
}

export async function updateSection(
  sectionId: string,
  payload: UpdateSectionPayload
): Promise<SectionRow> {
  const supabase = getClient();

  const result = await supabase
    .from("sections")
    .update(payload)
    .eq("id", sectionId)
    .select()
    .single();

  return throwIfError(result, "updateSection");
}

export async function deleteSection(sectionId: string): Promise<void> {
  const supabase = getClient();

  // Delete children first: resources → lectures → section
  const lecturesResult = await supabase
    .from("lectures")
    .select("id")
    .eq("section_id", sectionId);

  const lectureIds = (lecturesResult.data ?? []).map((l) => l.id);

  if (lectureIds.length > 0) {
    const { error: resError } = await supabase
      .from("resources")
      .delete()
      .in("lecture_id", lectureIds);
    if (resError) throw new Error(`Delete resources: ${resError.message}`);

    const { error: lecError } = await supabase
      .from("lectures")
      .delete()
      .eq("section_id", sectionId);
    if (lecError) throw new Error(`Delete lectures: ${lecError.message}`);
  }

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", sectionId);
  if (error) throw new Error(`Delete section: ${error.message}`);
}

/**
 * Batch-update section positions (for drag-and-drop reorder).
 * Accepts an array of { id, position } and updates each row.
 */
export async function reorderSections(
  updates: PositionUpdate[]
): Promise<void> {
  const supabase = getClient();

  // Supabase doesn't support batch updates in a single call for different rows,
  // so we use Promise.all with individual updates.
  // For production at scale, consider an RPC function.
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("sections").update({ position }).eq("id", id)
    )
  );

  for (const result of results) {
    if (result.error) {
      throw new Error(`reorderSections: ${result.error.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────
// LECTURES
// ─────────────────────────────────────────────────────────

export async function fetchLectures(sectionId: string): Promise<LectureRow[]> {
  const supabase = getClient();

  const result = await supabase
    .from("lectures")
    .select("*")
    .eq("section_id", sectionId)
    .order("position", { ascending: true });

  return throwIfError(result, "fetchLectures");
}

export async function addLecture(
  payload: AddLecturePayload
): Promise<LectureRow> {
  const supabase = getClient();

  const result = await supabase
    .from("lectures")
    .insert(payload)
    .select()
    .single();

  return throwIfError(result, "addLecture");
}

export async function updateLecture(
  lectureId: string,
  payload: UpdateLecturePayload
): Promise<LectureRow> {
  const supabase = getClient();

  const result = await supabase
    .from("lectures")
    .update(payload)
    .eq("id", lectureId)
    .select()
    .single();

  return throwIfError(result, "updateLecture");
}

export async function deleteLecture(lectureId: string): Promise<void> {
  const supabase = getClient();

  // Delete resources first
  const { error: resError } = await supabase
    .from("resources")
    .delete()
    .eq("lecture_id", lectureId);
  if (resError) throw new Error(`Delete resources: ${resError.message}`);

  const { error } = await supabase
    .from("lectures")
    .delete()
    .eq("id", lectureId);
  if (error) throw new Error(`Delete lecture: ${error.message}`);
}

/**
 * Batch-update lecture positions within a section (for drag-and-drop reorder).
 */
export async function reorderLectures(
  updates: PositionUpdate[]
): Promise<void> {
  const supabase = getClient();

  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("lectures").update({ position }).eq("id", id)
    )
  );

  for (const result of results) {
    if (result.error) {
      throw new Error(`reorderLectures: ${result.error.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────
// RESOURCES
// ─────────────────────────────────────────────────────────

export async function addResource(
  payload: AddResourcePayload
): Promise<ResourceRow> {
  const supabase = getClient();

  const result = await supabase
    .from("resources")
    .insert(payload)
    .select()
    .single();

  return throwIfError(result, "addResource");
}

export async function deleteResource(resourceId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);
  if (error) throw new Error(`Delete resource: ${error.message}`);
}
