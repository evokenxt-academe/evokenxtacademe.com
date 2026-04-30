import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ quizId: string }> }

// ── PATCH: Toggle publish ─────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId } = await params
    const { supabase } = auth
    const body = await request.json()

    const { error } = await supabase
        .from("quizzes")
        .update({ is_published: body.isPublished })
        .eq("id", quizId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
