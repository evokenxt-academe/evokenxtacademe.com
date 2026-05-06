import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import { parseQuestionsFromRawText } from "@/lib/parsers/regexQuizPdfParser"

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const body = (await request.json().catch(() => null)) as { text?: string } | null
    const text = body?.text?.trim() ?? ""

    if (!text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    const questions = parseQuestionsFromRawText(text)

    return NextResponse.json({
        questions,
        totalDetected: questions.length,
        format: text.startsWith("[") || text.startsWith("{") ? "json" : "text",
    })
}
