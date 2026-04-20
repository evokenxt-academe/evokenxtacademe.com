import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import { createLookupMap, normalizeUser } from "@/features/admin/lib/admin-normalizers";

type Row = Record<string, unknown>;

function isIntegerIdTypeError(error: { message?: string } | null | undefined) {
    return typeof error?.message === "string" && error.message.includes("invalid input syntax for type integer");
}

function pickString(row: Row, keys: string[], fallback = "") {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return fallback;
}

function pickNumber(row: Row, keys: string[], fallback = 0) {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim()) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return fallback;
}

function pickNullableNumber(row: Row, keys: string[]) {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim()) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return null;
}

function pickBoolean(row: Row, keys: string[], fallback = false) {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "boolean") {
            return value;
        }
    }

    return fallback;
}

function pickDate(row: Row, keys: string[], fallback = new Date().toISOString()) {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return fallback;
}

function toCourseId(value: string) {
    const courseId = value.trim();
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(courseId) ? courseId : null;
}

async function resolveCourseRecord(supabase: any, identifier: string) {
    const courseIdentifier = identifier.trim();
    const lookupColumns = toCourseId(courseIdentifier) ? ["id", "slug"] : ["slug", "id"];

    for (const column of lookupColumns) {
        const result = await supabase
            .from("courses")
            .select("*")
            .eq(column, courseIdentifier)
            .maybeSingle();

        if (result.error) {
            return { error: result.error.message } as const;
        }

        if (result.data) {
            return { data: result.data as Row } as const;
        }
    }

    return { data: null } as const;
}

async function deleteCourseTree(supabase: any, courseId: string) {
    const sectionIdsResult = await supabase
        .from("sections")
        .select("id")
        .eq("course_id", courseId);

    if (sectionIdsResult.error) {
        return { error: sectionIdsResult.error.message } as const;
    }

    const sectionIds = (sectionIdsResult.data ?? []).map((row: Row) => String(row.id));

    if (sectionIds.length > 0) {
        const lectureIdsResult = await supabase
            .from("lectures")
            .select("id")
            .in("section_id", sectionIds);

        if (lectureIdsResult.error) {
            return { error: lectureIdsResult.error.message } as const;
        }

        const lectureIds = (lectureIdsResult.data ?? []).map((row: Row) => String(row.id));

        if (lectureIds.length > 0) {
            const { error: resourceDeleteError } = await supabase
                .from("resources")
                .delete()
                .in("lecture_id", lectureIds);

            if (resourceDeleteError) {
                return { error: resourceDeleteError.message } as const;
            }
        }

        const { error: lectureDeleteError } = await supabase
            .from("lectures")
            .delete()
            .in("section_id", sectionIds);

        if (lectureDeleteError) {
            return { error: lectureDeleteError.message } as const;
        }

        const { error: sectionDeleteError } = await supabase
            .from("sections")
            .delete()
            .eq("course_id", courseId);

        if (sectionDeleteError) {
            return { error: sectionDeleteError.message } as const;
        }
    }

    const { error: courseDeleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

    if (courseDeleteError) {
        return { error: courseDeleteError.message } as const;
    }

    return { success: true } as const;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { courseId: courseIdParam } = await params;
    const courseResult = await resolveCourseRecord(supabase, courseIdParam);

    if ("error" in courseResult) {
        return NextResponse.json({ error: courseResult.error }, { status: 500 });
    }

    if (!courseResult.data) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const record = courseResult.data;
    const courseId = String(record.id);

    const usersResult = await supabase
        .from("users")
        .select("id, name, email")
        .order("created_at", { ascending: false });

    if (usersResult.error) {
        return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const userMap = createLookupMap(users);

    const sectionsResult = await supabase
        .from("sections")
        .select("*")
        .eq("course_id", courseId)
        .order("position", { ascending: true });

    if (sectionsResult.error) {
        return NextResponse.json({ error: sectionsResult.error.message }, { status: 500 });
    }

    const sections = (sectionsResult.data ?? []).map((row) => {
        const record = row as Row;
        return {
            id: pickString(record, ["id", "section_id"]),
            title: pickString(record, ["title", "name"], "Untitled section"),
            position: pickNumber(record, ["position", "sort_order"]),
        };
    });

    const sectionIds = sections.map((section) => section.id);
    const lecturesResult = sectionIds.length
        ? await supabase
            .from("lectures")
            .select("*")
            .in("section_id", sectionIds)
            .order("position", { ascending: true })
        : { data: [], error: null };

    if (lecturesResult.error) {
        return NextResponse.json({ error: lecturesResult.error.message }, { status: 500 });
    }

    const lectures = (lecturesResult.data ?? []).map((row) => {
        const record = row as Row;
        return {
            id: pickString(record, ["id", "lecture_id"]),
            sectionId: pickString(record, ["section_id"]),
            title: pickString(record, ["title", "name"], "Untitled lecture"),
            description: pickString(record, ["description", "summary"], ""),
            videoUrl: pickString(record, ["video_url", "videoUrl"], ""),
            durationSec: pickNumber(record, ["duration_sec", "durationSec"], 0),
            position: pickNumber(record, ["position", "sort_order"]),
            isPreview: pickBoolean(record, ["is_preview", "isPreview"]),
        };
    });

    const lectureIds = lectures.map((lecture) => lecture.id);
    const resourcesResult = lectureIds.length
        ? await supabase
            .from("resources")
            .select("*")
            .in("lecture_id", lectureIds)
        : { data: [], error: null };

    if (resourcesResult.error) {
        return NextResponse.json({ error: resourcesResult.error.message }, { status: 500 });
    }

    const resources = (resourcesResult.data ?? [])
        .map((row) => {
            const record = row as Row;
            return {
                id: pickString(record, ["id", "resource_id"]),
                lectureId: pickString(record, ["lecture_id"]),
                title: pickString(record, ["title", "name"], "Untitled resource"),
                fileUrl: pickString(record, ["file_url", "fileUrl"], ""),
            };
        })
        .filter((resource) => !!resource.fileUrl);

    const resourcesByLecture = new Map<string, typeof resources>();
    for (const resource of resources) {
        const bucket = resourcesByLecture.get(resource.lectureId) ?? [];
        bucket.push(resource);
        resourcesByLecture.set(resource.lectureId, bucket);
    }

    const lecturesBySection = new Map<string, Array<(typeof lectures)[number] & { resources: typeof resources }>>();
    for (const lecture of lectures) {
        const bucket = lecturesBySection.get(lecture.sectionId) ?? [];
        bucket.push({
            ...lecture,
            resources: resourcesByLecture.get(lecture.id) ?? [],
        });
        lecturesBySection.set(lecture.sectionId, bucket);
    }

    const enrichedSections = sections.map((section) => ({
        ...section,
        lectures: lecturesBySection.get(section.id) ?? [],
    }));

    const totalLectures = lectures.length;
    const totalResources = resources.length;
    const totalDurationSec = lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0);

    const instructor = userMap.get(String(record.instructor_id)) ?? null;

    return NextResponse.json({
        course: {
            id: pickString(record, ["id", "course_id"]),
            name: pickString(record, ["name", "title"], "Untitled course"),
            slug: pickString(record, ["slug"], ""),
            description: pickString(record, ["description", "summary"], ""),
            level: pickString(record, ["level"], "professional"),
            status: pickString(record, ["status"], "draft"),
            price: pickNumber(record, ["price", "amount", "list_price"], 0),
            discountPrice: pickNullableNumber(record, ["discount_price", "discountPrice"]),
            thumbnailUrl: pickString(record, ["thumbnail_url", "thumbnailUrl"], ""),
            createdAt: pickDate(record, ["created_at", "createdAt", "inserted_at"]),
            instructor: {
                id: instructor?.id ?? String(record.instructor_id ?? ""),
                name: instructor?.name ?? "Unknown instructor",
                email: instructor?.email ?? "",
            },
            stats: {
                totalSections: enrichedSections.length,
                totalLectures,
                totalResources,
                totalDurationSec,
            },
            sections: enrichedSections,
        },
    });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { courseId: courseIdParam } = await params;
    const courseResult = await resolveCourseRecord(supabase, courseIdParam);

    if ("error" in courseResult) {
        return NextResponse.json({ error: courseResult.error }, { status: 500 });
    }

    if (!courseResult.data) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseId = String(courseResult.data.id);

    const body = (await request.json().catch(() => null)) as { status?: string } | null;
    if (!body?.status || !["draft", "published", "archived"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await supabase
        .from("courses")
        .update({ status: body.status })
        .eq("id", courseId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, courseId });
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { courseId: courseIdParam } = await params;
    const courseResult = await resolveCourseRecord(supabase, courseIdParam);

    if ("error" in courseResult) {
        return NextResponse.json({ error: courseResult.error }, { status: 500 });
    }

    if (!courseResult.data) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseId = String(courseResult.data.id);

    const result = await deleteCourseTree(supabase, courseId);
    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { courseId: courseIdParam } = await params;
    const courseResult = await resolveCourseRecord(supabase, courseIdParam);

    if ("error" in courseResult) {
        return NextResponse.json({ error: courseResult.error }, { status: 500 });
    }

    if (!courseResult.data) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const { userId } = auth;
    const courseId = String(courseResult.data.id);

    const { error: courseError } = await supabase
        .from("courses")
        .update({
            name: body.name,
            slug: body.slug,
            description: body.description,
            level: body.level,
            thumbnail_url: body.thumbnailUrl || null,
            instructor_id: body.instructorId || userId,
            price: body.price || 0,
            discount_price: body.discountPrice || null,
            status: body.status || "draft",
            total_duration_sec: body.totalDurationSec || 0,
        })
        .eq("id", courseId);

    if (courseError) {
        if (isIntegerIdTypeError(courseError)) {
            return NextResponse.json(
                {
                    error:
                        "Supabase still has an integer id column. courses.id, sections.course_id, lectures.section_id, and resources.lecture_id must be uuid.",
                },
                { status: 500 },
            );
        }
        return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    const deleteExistingResult = await deleteCourseTree(supabase, courseId);
    if ("error" in deleteExistingResult) {
        return NextResponse.json({ error: deleteExistingResult.error }, { status: 500 });
    }

    for (const section of body.sections ?? []) {
        const { data: insertedSection, error: sectionError } = await supabase
            .from("sections")
            .insert({
                id: crypto.randomUUID(),
                course_id: courseId,
                title: section.title,
                position: section.position,
            })
            .select("id")
            .single();

        if (sectionError || !insertedSection) {
            if (isIntegerIdTypeError(sectionError)) {
                return NextResponse.json(
                    {
                        error:
                            "Supabase still has an integer id/foreign-key column. sections.id and sections.course_id must be uuid.",
                    },
                    { status: 500 },
                );
            }
            return NextResponse.json(
                { error: sectionError?.message || "Failed to update sections" },
                { status: 500 },
            );
        }

        for (const lecture of section.lectures ?? []) {
            const { data: insertedLecture, error: lectureError } = await supabase
                .from("lectures")
                .insert({
                    id: crypto.randomUUID(),
                    section_id: insertedSection.id,
                    title: lecture.title,
                    video_url: lecture.videoUrl || null,
                    description: lecture.description || null,
                    duration_sec: lecture.durationSec || 0,
                    position: lecture.position,
                    is_preview: lecture.isPreview || false,
                })
                .select("id")
                .single();

            if (lectureError || !insertedLecture) {
                if (isIntegerIdTypeError(lectureError)) {
                    return NextResponse.json(
                        {
                            error:
                                "Supabase still has an integer id/foreign-key column. lectures.id and lectures.section_id must be uuid.",
                        },
                        { status: 500 },
                    );
                }
                return NextResponse.json(
                    { error: lectureError?.message || "Failed to update lectures" },
                    { status: 500 },
                );
            }

            for (const resource of lecture.resources ?? []) {
                if (!resource.fileUrl) {
                    continue;
                }

                const { error: resourceError } = await supabase
                    .from("resources")
                    .insert({
                        id: crypto.randomUUID(),
                        lecture_id: insertedLecture.id,
                        title: resource.title || "Untitled",
                        file_url: resource.fileUrl,
                    });
                if (resourceError) {
                    if (isIntegerIdTypeError(resourceError)) {
                        return NextResponse.json(
                            {
                                error:
                                    "Supabase still has an integer id/foreign-key column. resources.id and resources.lecture_id must be uuid.",
                            },
                            { status: 500 },
                        );
                    }
                    return NextResponse.json(
                        { error: resourceError.message },
                        { status: 500 },
                    );
                }
            }
        }
    }

    return NextResponse.json({ success: true, courseId });
}