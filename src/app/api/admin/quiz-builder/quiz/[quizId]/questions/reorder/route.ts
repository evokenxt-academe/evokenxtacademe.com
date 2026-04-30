import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ quizId: string }> }

// ── PATCH: Reorder questions ──────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId } = await params
    const { supabase } = auth
    const body = await request.json()

    const { orderedIds } = body as { orderedIds: string[] }

    if (!orderedIds?.length) {
        return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
    }

    // Update positions based on index
    const updates = orderedIds.map((id, index) =>
        supabase
            .from("quiz_questions")
            .update({ position: index })
            .eq("id", id)
            .eq("quiz_id", quizId)
    )

    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)

    if (failed?.error) {
        return NextResponse.json({ error: failed.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
