import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ResourceRow = {
    id: string;
    title: string;
    file_url: string;
};

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
    const lectureId = request.nextUrl.searchParams.get("lectureId")?.trim() ?? "";

    if (!slug || !lectureId) {
        return NextResponse.json(
            { error: "slug and lectureId are required" },
            { status: 400 },
        );
    }

    const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();

    if (courseError) {
        return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseRow = course as { id: string };

    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseRow.id)
        .eq("status", "active")
        .maybeSingle();

    if (!enrollment) {
        return NextResponse.json(
            { error: "You are not enrolled in this course" },
            { status: 403 },
        );
    }

    const { data: sections, error: sectionError } = await supabase
        .from("sections")
        .select("id, lectures(id)")
        .eq("course_id", courseRow.id)
        .order("position", { ascending: true });

    if (sectionError) {
        return NextResponse.json({ error: sectionError.message }, { status: 500 });
    }

    const typedSections = (Array.isArray(sections) ? sections : []) as Array<{
        lectures?: Array<{ id?: string }> | null;
    }>;

    const lectureIds = typedSections
        .flatMap((section) => (Array.isArray(section.lectures) ? section.lectures : []))
        .map((lecture) => String((lecture as { id?: string }).id ?? ""))
        .filter(Boolean);

    if (!lectureIds.includes(lectureId)) {
        return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const adminClient = await import("@/utils/supabase/adminClient").then(m => m.createAdminClient());
    const { data, error } = await adminClient
        .from("resources")
        .select("id, title, file_url")
        .eq("lecture_id", lectureId)
        .order("title", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const resources = (Array.isArray(data) ? (data as ResourceRow[]) : [])
        .filter((resource) => resource.id && resource.title && resource.file_url)
        .map((resource) => ({
            id: resource.id,
            title: resource.title,
            fileUrl: resource.file_url,
        }));

    return NextResponse.json({ resources });
}