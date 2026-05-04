"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Program,
  Course,
  Enrollment,
  EnrollmentStatus,
} from "@/types/database-v2.types";

/**
 * Get all programs for admin
 */
export async function getPrograms() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    return { error: "Admin access required" };
  }

  try {
    const { data: programs, error } = await supabase
      .from("programs")
      .select(
        `
        id,
        name,
        body_type,
        description,
        thumbnail_url,
        created_at,
        levels(id, name, program_id)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { programs };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get courses with enrollment stats for admin
 */
export async function getAdminCourses() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Check admin access
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Admin access required" };
  }

  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select(
        `
        id,
        name,
        slug,
        level,
        status,
        price,
        discount_price,
        created_at,
        enrollments(id, status)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    // Calculate stats
    const courseStats = (courses || []).map((course) => {
      const enrollments = course.enrollments || [];
      return {
        ...course,
        stats: {
          totalEnrollments: enrollments.length,
          activeEnrollments: enrollments.filter(
            (e) => e.status === "active"
          ).length,
          completedEnrollments: enrollments.filter(
            (e) => e.status === "completed"
          ).length,
        },
      };
    });

    return { courses: courseStats };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get enrollments with student and payment info for admin
 */
export async function getAdminEnrollments(courseId?: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Check admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Admin access required" };
  }

  try {
    let query = supabase.from("enrollments").select(
      `
      id,
      user_id,
      course_id,
      status,
      enrolled_at,
      completed_at,
      user:users!user_id (id, email, name),
      course:courses!course_id (id, name),
      payments(id, amount, status, payment_method)
    `
    );

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: enrollments, error } = await query.order("enrolled_at", {
      ascending: false,
    });

    if (error) {
      return { error: error.message };
    }

    return { enrollments };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Update enrollment status
 */
export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Check admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Admin access required" };
  }

  try {
    const updateData: any = {
      status,
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("id", enrollmentId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { enrollment: updated };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get payment analytics for admin
 */
export async function getPaymentAnalytics(courseId?: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Check admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Admin access required" };
  }

  try {
    let query = supabase.from("payments").select(
      `
      id,
      amount,
      status,
      payment_method,
      created_at,
      enrollment:enrollments!enrollment_id (
        course_id,
        user_id
      )
    `
    );

    if (courseId) {
      query = query.eq("enrollment.course_id", courseId);
    }

    const { data: payments, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return { error: error.message };
    }

    // Calculate analytics
    const totalRevenue = (payments || []).reduce(
      (sum, p) => sum + (p.status === "completed" ? p.amount : 0),
      0
    );
    const pendingRevenue = (payments || []).reduce(
      (sum, p) => sum + (p.status === "pending" ? p.amount : 0),
      0
    );

    return {
      payments,
      analytics: {
        totalRevenue,
        pendingRevenue,
        totalTransactions: payments?.length || 0,
        completedTransactions: (payments || []).filter(
          (p) => p.status === "completed"
        ).length,
      },
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
