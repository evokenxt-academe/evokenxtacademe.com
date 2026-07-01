import { createAdminClient } from "@/utils/supabase/adminClient";

/**
 * Auto-enrolls a specific user in all courses if they are an admin or instructor.
 */
export async function autoEnrollUserInAllCourses(userId: string, role?: string) {
  try {
    const adminClient = createAdminClient();

    let userRole = role;
    if (!userRole) {
      const { data: userProfile } = await adminClient
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      userRole = userProfile?.role;
    }

    if (userRole !== "admin" && userRole !== "instructor") {
      return;
    }

    // Fetch all courses
    const { data: courses, error: coursesError } = await adminClient
      .from("courses")
      .select("id");

    if (coursesError || !courses) {
      console.error("[autoEnroll] Failed to fetch courses:", coursesError);
      return;
    }

    if (courses.length === 0) return;

    const payloads = courses.map((course) => ({
      user_id: userId,
      course_id: course.id,
      status: "active",
      enrolled_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await adminClient
      .from("enrollments")
      .upsert(payloads, { onConflict: "user_id,course_id" });

    if (upsertError) {
      console.error("[autoEnroll] Failed to upsert enrollments for user:", upsertError.message);
    }
  } catch (err) {
    console.error("[autoEnroll] Error in autoEnrollUserInAllCourses:", err);
  }
}
