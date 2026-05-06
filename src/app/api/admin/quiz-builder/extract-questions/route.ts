import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { PDFExtractionResult } from "@/features/admin/quiz-builder/types"
import { parseQuestionsFromRawText } from "@/lib/parsers/regexQuizPdfParser"
import { PDFParse } from "pdf-parse"

// ─────────────────────────────────────────────────────────────
// Deterministic PDF question extractor — NO AI required
//
// Replaces the old Anthropic-based extractor with pdf-parse.
// Parses structured question formats from PDF text.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "PDF file is required" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    try {
        // Use pdf-parse to extract text — no API key needed
        const buffer = Buffer.from(await file.arrayBuffer())
        const parser = new PDFParse({ data: buffer })
        let text: string

        try {
            const pdf = await parser.getText()
            text = pdf.text?.trim() ?? ""
        } finally {
            await parser.destroy()
        }

        if (!text) {
            return NextResponse.json(
                { error: "Could not extract any text from the PDF. Make sure it contains selectable text (not scanned images)." },
                { status: 422 },
            )
        }

        const questions = parseQuestionsFromRawText(text)

        const result: PDFExtractionResult = {
            questions,
            totalDetected: questions.length,
            format: "pdf",
        }

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to extract questions from PDF"
        console.error("[extract-questions] PDF parse error:", error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
