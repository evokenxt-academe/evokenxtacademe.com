import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    createLookupMap,
    normalizeCourse,
    normalizePayment,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [paymentsResult, usersResult, coursesResult] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, name, email").order("created_at", { ascending: false }),
        supabase.from("courses").select("id, title").order("created_at", { ascending: false }),
    ]);

    const errors = [paymentsResult.error, usersResult.error, coursesResult.error].filter(Boolean);
    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load payments";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const courses = (coursesResult.data ?? []).map((row) => normalizeCourse(row as Record<string, unknown>));
    const userMap = createLookupMap(users);
    const courseMap = createLookupMap(courses);

    const payments = (paymentsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const user = userMap.get(String(record.user_id ?? record.student_id))?.name;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizePayment(record, user, course);
    });

    return NextResponse.json({ payments });
}