/**
 * Courses Query Layer
 * ===================
 * Queries for courses, chapters, lectures, and course management
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CourseRow {
    id: string;
    title: string;
    subject_id: string;
    instructor_id: string | null;
    slug: string;
    status: string;
    total_students: number;
    avg_rating: number | null;
    instructor_name?: string;
    level_label?: string;
    program_body?: string;
}

export interface CourseDetail extends CourseRow {
    description?: string;
    thumbnail_url?: string;
    language?: string;
    chapters_count?: number;
}

/**
 * Get all courses with instructor and subject info
 */
export async function getAllCourses(
    supabase: SupabaseClient<any>,
    filters?: {
        program?: string;
        status?: string;
        instructor_id?: string;
    }
): Promise<CourseRow[]> {
    let query = supabase
        .from("courses")
        .select(
            `id, title, subject_id, instructor_id, slug, status, total_students, avg_rating,
       instructor:users(name),
       subject:subjects(
         id,
         name,
         program_level:program_levels(
           id,
           label,
           program:programs(body)
         )
       )`
        )
        .order("created_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.instructor_id) {
        query = query.eq("instructor_id", filters.instructor_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[courses] getAllCourses error:", error.message);
        return [];
    }

    return (data ?? []).map((course: any) => ({
        id: course.id,
        title: course.title,
        subject_id: course.subject_id,
        instructor_id: course.instructor_id,
        slug: course.slug,
        status: course.status,
        total_students: course.total_students,
        avg_rating: course.avg_rating,
        instructor_name: course.instructor?.name,
        level_label: course.subject?.program_level?.label,
        program_body: course.subject?.program_level?.program?.body,
    }));
}

/**
 * Get course by ID with full details
 */
export async function getCourseById(
    supabase: SupabaseClient<any>,
    courseId: string
): Promise<CourseDetail | null> {
    const { data, error } = await supabase
        .from("courses")
        .select(
            `id, title, subject_id, instructor_id, slug, status, total_students, avg_rating,
       description, thumbnail_url, language,
       instructor:users(name),
       subject:subjects(name),
       chapters(id)`
        )
        .eq("id", courseId)
        .single();

    if (error) {
        console.error("[courses] getCourseById error:", error.message);
        return null;
    }

    if (!data) return null;

    return {
        id: data.id,
        title: data.title,
        subject_id: data.subject_id,
        instructor_id: data.instructor_id,
        slug: data.slug,
        status: data.status,
        total_students: data.total_students,
        avg_rating: data.avg_rating,
        instructor_name: data.instructor?.name,
        description: data.description,
        thumbnail_url: data.thumbnail_url,
        language: data.language,
        chapters_count: (data.chapters as any[]).length,
    };
}

/**
 * Create new course
 */
export async function createCourse(
    supabase: SupabaseClient<any>,
    courseData: {
        title: string;
        subject_id: string;
        instructor_id: string;
        slug: string;
        status: string;
        description?: string;
        thumbnail_url?: string;
        language?: string;
    }
): Promise<{ id: string } | null> {
    const { data, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select("id")
        .single();

    if (error) {
        console.error("[courses] createCourse error:", error.message);
        return null;
    }

    return data;
}

/**
 * Update course
 */
export async function updateCourse(
    supabase: SupabaseClient<any>,
    courseId: string,
    updates: Partial<{
        title: string;
        status: string;
        description: string;
        thumbnail_url: string;
        language: string;
    }>
): Promise<boolean> {
    const { error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", courseId);

    if (error) {
        console.error("[courses] updateCourse error:", error.message);
        return false;
    }

    return true;
}

/**
 * Delete course (archive)
 */
export async function archiveCourse(
    supabase: SupabaseClient<Database>,
    courseId: string
): Promise<boolean> {
    return updateCourse(supabase, courseId, { status: "archived" });
}
