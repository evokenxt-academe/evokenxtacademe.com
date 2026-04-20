import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    createLookupMap,
    normalizeCourse,
    normalizeEnrollment,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [enrollmentsResult, usersResult, coursesResult] = await Promise.all([
        supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, name, email").order("created_at", { ascending: false }),
        supabase.from("courses").select("id, name").order("created_at", { ascending: false }),
    ]);

    const errors = [enrollmentsResult.error, usersResult.error, coursesResult.error].filter(Boolean);
    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load enrollments";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const courses = (coursesResult.data ?? []).map((row) => normalizeCourse(row as Record<string, unknown>));
    const userMap = createLookupMap(users);
    const courseMap = createLookupMap(courses);

    const enrollments = (enrollmentsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const user = userMap.get(String(record.user_id))?.name;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizeEnrollment(record, user, course);
    });

    return NextResponse.json({ enrollments });
}