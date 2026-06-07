import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import {
    createLookupMap,
    normalizeCourse,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers"
import { notifyNewCourse } from "@/lib/notifications/server"

function isIntegerIdTypeError(error: { message?: string } | null | undefined) {
    return typeof error?.message === "string" && error.message.includes("invalid input syntax for type integer")
}

/**
 * POST /api/admin/courses
 * Creates a full course with sections, lectures, and resources in Supabase.
 * Uses a transactional approach — if any step fails, returns an error.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const { supabase, userId } = auth

        const body = await request.json()
        const newCourseId = crypto.randomUUID()

        // ── 1. Insert the course ─────────────────────────────
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .insert({
                id: newCourseId,
                name: body.name,
                slug: body.slug,
                description: body.description,
                level: body.level,
                thumbnail_url: body.thumbnailUrl || null,
                instructor_id: body.instructorId || userId,
                price: body.price || 0,
                discount_price: body.discountPrice || null,
                status: body.status || "draft",
            })
            .select("id")
            .single()

        if (courseError || !course) {
            console.error("Course insert error:", courseError)
            const message = isIntegerIdTypeError(courseError)
                ? "Supabase still has an integer id column. Change courses.id, sections.course_id, lectures.section_id, and resources.lecture_id to uuid."
                : courseError?.message || "Failed to create course"

            return NextResponse.json(
                { error: message },
                { status: 500 }
            )
        }

        const courseId = String(course.id)

        // ── 2. Insert sections + lectures + resources ────────
        for (const section of body.sections || []) {
            const { data: insertedSection, error: sectionError } = await supabase
                .from("sections")
                .insert({
                    id: crypto.randomUUID(),
                    course_id: courseId,
                    title: section.title,
                    position: section.position,
                })
                .select("id")
                .single()

            if (sectionError || !insertedSection) {
                console.error(`Section insert error for course ${courseId}:`, sectionError)
                return NextResponse.json(
                    {
                        error: isIntegerIdTypeError(sectionError)
                            ? "Supabase still has an integer id/foreign-key column. sections.id and sections.course_id must be uuid."
                            : `${sectionError?.message || "Failed to insert section"} (Course ID: ${courseId})`
                    },
                    { status: 500 }
                )
            }

            for (const lecture of section.lectures || []) {
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
                    .single()

                if (lectureError || !insertedLecture) {
                    console.error("Lecture insert error:", lectureError)
                    return NextResponse.json(
                        {
                            error: isIntegerIdTypeError(lectureError) 
                                ? "Supabase still has an integer id/foreign-key column. lectures.id and lectures.section_id must be uuid."
                                : lectureError?.message || "Failed to insert lecture"
                        },
                        { status: 500 }
                    )
                }

                for (const resource of lecture.resources || []) {
                    if (!resource.fileUrl) continue

                    const { error: resourceError } = await supabase
                        .from("resources")
                        .insert({
                            id: crypto.randomUUID(),
                            lecture_id: insertedLecture.id,
                            title: resource.title || "Untitled",
                            file_url: resource.fileUrl,
                        })

                    if (resourceError) {
                        if (isIntegerIdTypeError(resourceError)) {
                            return NextResponse.json(
                                {
                                    error:
                                        "Supabase still has an integer id/foreign-key column. resources.id and resources.lecture_id must be uuid.",
                                },
                                { status: 500 }
                            )
                        }
                        console.error("Resource insert error:", resourceError)
                    }
                }
            }
        }

        const courseStatus = body.status || "draft"

        if (courseStatus === "published") {
            after(async () => {
                await notifyNewCourse({
                    courseId,
                    name: body.name,
                    slug: body.slug,
                    thumbnailUrl: body.thumbnailUrl || null,
                })
            })
        }

        return NextResponse.json(
            { success: true, courseId, message: "Course created successfully" },
            { status: 201 }
        )
    } catch (err) {
        console.error("Course creation failed:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function GET() {
    const auth = await requireAdmin()
    if ("error" in auth) {
        return auth.error
    }

    const { supabase } = auth

    const [coursesResult, usersResult] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, name, email").order("created_at", { ascending: false }),
    ])

    if (coursesResult.error) {
        return NextResponse.json({ error: coursesResult.error.message }, { status: 500 })
    }

    if (usersResult.error) {
        return NextResponse.json({ error: usersResult.error.message }, { status: 500 })
    }

    const users = (usersResult.data ?? []).map(normalizeUser)
    const userMap = createLookupMap(users)

    const courses = (coursesResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>
        const instructor = userMap.get(String(record.instructor_id))?.name
        return normalizeCourse(record, instructor)
    })

    return NextResponse.json({ courses })
}
