import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPublishedCourses } from "@/lib/supabase/queries";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const programId = searchParams.get("programId") ?? undefined;
    const levelId = searchParams.get("levelId") ?? undefined;
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const { data, error } = await getPublishedCourses(supabase, {
        subjectId,
        programId,
        levelId,
        featured,
        limit,
    });

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ courses: data ?? [] });
}
