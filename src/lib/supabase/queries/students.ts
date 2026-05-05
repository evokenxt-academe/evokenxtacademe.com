/**
 * Students Query Layer
 * ====================
 * Queries for student profiles, enrollments, and student management
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface StudentRow {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    target_exam_body: string;
    country: string;
    graduated_year: number | null;
    enrolled_courses: number;
    joined_at: string;
    is_active: boolean;
}

/**
 * Get all students with profile info
 */
export async function getAllStudents(
    supabase: SupabaseClient<any>,
    filters?: {
        country?: string;
        target_exam_body?: string;
        is_active?: boolean;
    }
): Promise<StudentRow[]> {
    let query = supabase
        .from("users")
        .select(
            `id, name, email, avatar, is_active, created_at,
       student_profile:student_profiles(
         target_exam_body,
         country,
         graduation_year
       ),
       enrollments(id)`
        )
        .eq("role", "student")
        .order("created_at", { ascending: false });

    if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
    }

    if (filters?.country) {
        query = query.eq("student_profiles.country", filters.country);
    }

    if (filters?.target_exam_body) {
        query = query.eq("student_profiles.target_exam_body", filters.target_exam_body);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[students] getAllStudents error:", error.message);
        return [];
    }

    return (data ?? []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        target_exam_body: user.student_profile?.[0]?.target_exam_body || "Unknown",
        country: user.student_profile?.[0]?.country || "Unknown",
        graduated_year: user.student_profile?.[0]?.graduation_year,
        enrolled_courses: (user.enrollments as any[])?.length || 0,
        joined_at: new Date(user.created_at).toLocaleDateString("en-IN"),
        is_active: user.is_active,
    }));
}

/**
 * Get student by ID with full details
 */
export async function getStudentById(
    supabase: SupabaseClient<any>,
    studentId: string
): Promise<StudentRow | null> {
    const { data, error } = await supabase
        .from("users")
        .select(
            `id, name, email, avatar, is_active, created_at,
       student_profile:student_profiles(*),
       enrollments(id)`
        )
        .eq("id", studentId)
        .single();

    if (error) {
        console.error("[students] getStudentById error:", error.message);
        return null;
    }

    if (!data) return null;

    const profile = (data.student_profile as any[])?.[0];

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        target_exam_body: profile?.target_exam_body || "Unknown",
        country: profile?.country || "Unknown",
        graduated_year: profile?.graduation_year,
        enrolled_courses: (data.enrollments as any[])?.length || 0,
        joined_at: new Date(data.created_at).toLocaleDateString("en-IN"),
        is_active: data.is_active,
    };
}

/**
 * Toggle student active status
 */
export async function toggleStudentStatus(
    supabase: SupabaseClient<any>,
    studentId: string,
    isActive: boolean
): Promise<boolean> {
    const { error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", studentId);

    if (error) {
        console.error("[students] toggleStudentStatus error:", error.message);
        return false;
    }

    return true;
}

/**
 * Get student's enrollments
 */
export async function getStudentEnrollments(
    supabase: SupabaseClient<any>,
    studentId: string
): Promise<
    Array<{
        id: string;
        course_title: string;
        status: string;
        enrolled_at: string;
        progress: number;
    }>
> {
    const { data, error } = await supabase
        .from("enrollments")
        .select(
            `id, status, enrolled_at,
       course:courses(title),
       lecture_progress(id)`
        )
        .eq("user_id", studentId)
        .order("enrolled_at", { ascending: false });

    if (error) {
        console.error("[students] getStudentEnrollments error:", error.message);
        return [];
    }

    return (data ?? []).map((enrollment: any) => ({
        id: enrollment.id,
        course_title: enrollment.course?.title || "Unknown",
        status: enrollment.status,
        enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString("en-IN"),
        progress: (enrollment.lecture_progress as any[])?.length || 0,
    }));
}

/**
 * Get student's certificates
 */
export async function getStudentCertificates(
    supabase: SupabaseClient<any>,
    studentId: string
): Promise<
    Array<{
        id: string;
        course_title: string;
        cert_number: string;
        issued_at: string;
    }>
> {
    const { data, error } = await supabase
        .from("certificates")
        .select(
            `id, cert_number, issued_at,
       course:courses(title)`
        )
        .eq("user_id", studentId)
        .eq("status", "issued")
        .order("issued_at", { ascending: false });

    if (error) {
        console.error("[students] getStudentCertificates error:", error.message);
        return [];
    }

    return (data ?? []).map((cert: any) => ({
        id: cert.id,
        course_title: cert.course?.title || "Unknown",
        cert_number: cert.cert_number,
        issued_at: new Date(cert.issued_at).toLocaleDateString("en-IN"),
    }));
}
