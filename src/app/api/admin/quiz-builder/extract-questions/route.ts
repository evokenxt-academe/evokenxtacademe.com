import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { PDFExtractionResult } from "@/features/admin/quiz-builder/types"

async function callAnthropicExtractQuestions(base64Pdf: string): Promise<PDFExtractionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for PDF extraction")
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            temperature: 0,
            system:
                "Extract all questions from the attached PDF and return only valid JSON with shape { questions: [...], totalDetected: number, format: string }. Each question must include question, type, difficulty, marks, explanation, tags, options, and correctAnswer where available.",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "document",
                            source: {
                                type: "base64",
                                media_type: "application/pdf",
                                data: base64Pdf,
                            },
                        },
                        {
                            type: "text",
                            text: "Extract the questions as JSON only.",
                        },
                    ],
                },
            ],
        }),
    })

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(payload?.error?.message || `Anthropic request failed (${response.status})`)
    }

    const data = (await response.json()) as {
        content?: Array<{ text?: string }>
    }

    const text = data.content?.map((part) => part.text ?? "").join("\n") ?? ""
    const jsonStart = text.indexOf("{")
    const jsonEnd = text.lastIndexOf("}")

    if (jsonStart < 0 || jsonEnd < 0) {
        throw new Error("Claude did not return structured JSON")
    }

    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as PDFExtractionResult
}

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

    const base64Pdf = Buffer.from(await file.arrayBuffer()).toString("base64")

    try {
        const result = await callAnthropicExtractQuestions(base64Pdf)
        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to extract questions"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
