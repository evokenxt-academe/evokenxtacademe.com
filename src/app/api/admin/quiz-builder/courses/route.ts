import { NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

export async function GET() {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth

    const { data: courses, error } = await supabase
        .from("courses")
        .select("id, name, sections(id, title, position)")
        .order("name", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const courseSections = (courses ?? []).map((course) => ({
        courseId: course.id,
        courseName: course.name,
        sections: ((course.sections as Array<{ id: string; title: string; position: number }>) ?? [])
            .sort((a, b) => a.position - b.position),
    }))

    return NextResponse.json({ courseSections })
}
