import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    createLookupMap,
    normalizeCourse,
    normalizeLiveStream,
} from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [streamsResult, coursesResult] = await Promise.all([
        supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }),
        supabase.from("courses").select("id, name").order("created_at", { ascending: false }),
    ]);

    const errors = [streamsResult.error, coursesResult.error].filter(Boolean);
    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load streams";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const courses = (coursesResult.data ?? []).map((row) => normalizeCourse(row as Record<string, unknown>));
    const courseMap = createLookupMap(courses);

    const liveStreams = (streamsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizeLiveStream(record, course);
    });

    return NextResponse.json({ liveStreams });
}