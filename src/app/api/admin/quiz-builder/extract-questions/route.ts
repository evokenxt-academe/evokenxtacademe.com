import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { PDFExtractionResult, ParsedQuestion, QuestionType, DifficultyLevel } from "@/features/admin/quiz-builder/types"
import pdfParse from "pdf-parse"

// ─────────────────────────────────────────────────────────────
// Deterministic PDF question extractor — NO AI required
//
// Replaces the old Anthropic-based extractor with pdf-parse.
// Parses structured question formats from PDF text.
// ─────────────────────────────────────────────────────────────

const QUESTION_TYPES: QuestionType[] = [
    "mcq",
    "multiple_select",
    "subjective",
    "fill_in_the_blanks",
    "true_or_false",
    "assertion_reasoning",
    "number",
]

function isQuestionType(value: string): value is QuestionType {
    return QUESTION_TYPES.includes(value as QuestionType)
}

function isDifficulty(value: string): value is DifficultyLevel {
    return ["easy", "medium", "hard"].includes(value as DifficultyLevel)
}

function normalizeQuestionText(value: string): string {
    return value.replace(/^\d+[.)\-]\s*/, "").trim()
}

function parseLabelValue(line: string, label: string): string | null {
    const pattern = new RegExp(`^${label}[:\\-]\\s*(.+)$`, "i")
    const match = line.match(pattern)
    return match?.[1]?.trim() ?? null
}

function inferDifficulty(text: string): DifficultyLevel {
    const lower = text.toLowerCase()
    if (lower.includes("hard") || lower.includes("advanced")) return "hard"
    if (lower.includes("easy") || lower.includes("basic")) return "easy"
    return "medium"
}

function parseOptionText(line: string): string {
    return line
        .replace(/^\(?[a-z0-9]+\)?[.)\-:]\s*/i, "")
        .replace(/^[-*]\s*/, "")
        .trim()
}

function parseQuestionBlock(block: string): ParsedQuestion | null {
    const rawLines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (rawLines.length === 0) return null

    const questionLine = normalizeQuestionText(rawLines[0])
    const metaLines = rawLines.slice(1)
    const tags = new Set<string>()
    const options: { text: string; isCorrect: boolean }[] = []
    let correctAnswer = ""
    let explanation = ""
    let marks = 1
    let type: QuestionType = "mcq"
    let difficulty: DifficultyLevel = inferDifficulty(block)

    for (const line of metaLines) {
        const questionType = parseLabelValue(line, "type")
        if (questionType && isQuestionType(questionType)) {
            type = questionType
            continue
        }

        const marksValue = parseLabelValue(line, "marks")
        if (marksValue) {
            const parsedMarks = Number(marksValue)
            if (!Number.isNaN(parsedMarks) && parsedMarks > 0) {
                marks = parsedMarks
            }
            continue
        }

        const difficultyValue = parseLabelValue(line, "difficulty")
        if (difficultyValue && isDifficulty(difficultyValue)) {
            difficulty = difficultyValue
            continue
        }

        const explanationValue = parseLabelValue(line, "explanation")
        if (explanationValue) {
            explanation = explanationValue
            continue
        }

        const tagsValue = parseLabelValue(line, "tags")
        if (tagsValue) {
            tagsValue
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .forEach((tag) => tags.add(tag))
            continue
        }

        const answerValue = parseLabelValue(line, "answer")
        if (answerValue) {
            correctAnswer = answerValue
            continue
        }

        if (/^[-*]|^[a-z0-9]+[.)]/i.test(line)) {
            options.push({ text: parseOptionText(line), isCorrect: false })
            continue
        }

        if (line.toLowerCase().startsWith("correct:")) {
            correctAnswer = line.replace(/^correct:\s*/i, "").trim()
            continue
        }

        if (line.toLowerCase().startsWith("why:") || line.toLowerCase().startsWith("because:")) {
            explanation = line.replace(/^(why|because):\s*/i, "").trim()
        }
    }

    if (questionLine.includes("____") || questionLine.includes("___")) {
        type = "fill_in_the_blanks"
    }

    if (options.length === 0) {
        if (correctAnswer) {
            type = "subjective"
        }
        return {
            question: questionLine,
            type,
            difficulty,
            marks,
            explanation: explanation || undefined,
            tags: Array.from(tags),
            correctAnswer: correctAnswer || undefined,
        }
    }

    const loweredAnswer = correctAnswer.toLowerCase()
    const answerLetters = loweredAnswer.match(/^[a-z]/)?.[0]

    for (const option of options) {
        const lowerOption = option.text.toLowerCase()
        if (
            lowerOption === loweredAnswer ||
            lowerOption === loweredAnswer.replace(/^[a-z][.)\-:]\s*/, "") ||
            (answerLetters && lowerOption.startsWith(answerLetters))
        ) {
            option.isCorrect = true
        }
    }

    if (options.length === 2) {
        const normalized = options.map((option) => option.text.toLowerCase())
        if (normalized.includes("true") && normalized.includes("false")) {
            type = "true_or_false"
        }
    }

    return {
        question: questionLine,
        type,
        difficulty,
        marks,
        explanation: explanation || undefined,
        tags: Array.from(tags),
        options,
        correctAnswer: correctAnswer || undefined,
    }
}

function parseStructuredText(text: string): ParsedQuestion[] {
    const normalized = text.replace(/\r\n/g, "\n").trim()
    if (!normalized) return []

    if (normalized.startsWith("[") || normalized.startsWith("{")) {
        try {
            const parsed = JSON.parse(normalized)
            const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.questions) ? parsed.questions : []

            return items
                .map((item: Record<string, unknown>) => ({
                    question: String(item.question ?? item.text ?? "").trim(),
                    type: isQuestionType(String(item.type ?? "mcq")) ? (String(item.type ?? "mcq") as QuestionType) : "mcq",
                    difficulty: isDifficulty(String(item.difficulty ?? "medium"))
                        ? (String(item.difficulty ?? "medium") as DifficultyLevel)
                        : "medium",
                    marks: Number(item.marks ?? 1) || 1,
                    explanation: item.explanation ? String(item.explanation) : undefined,
                    tags: Array.isArray(item.tags)
                        ? item.tags.map((tag) => String(tag).trim()).filter(Boolean)
                        : undefined,
                    options: Array.isArray(item.options)
                        ? item.options
                            .map((option: Record<string, unknown>) => ({
                                text: String(option.text ?? "").trim(),
                                isCorrect: Boolean(option.isCorrect ?? option.is_correct),
                            }))
                            .filter((option) => option.text)
                        : undefined,
                    correctAnswer: item.correctAnswer ? String(item.correctAnswer) : undefined,
                }))
                .filter((item: ParsedQuestion) => item.question)
        } catch {
            // Fall through to block parsing.
        }
    }

    const blocks = normalized
        .split(/\n\s*\n+/)
        .map((block) => block.trim())
        .filter(Boolean)

    return blocks.map(parseQuestionBlock).filter((item): item is ParsedQuestion => Boolean(item))
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

    try {
        // Use pdf-parse to extract text — no API key needed
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdf = await pdfParse(buffer)
        const text = pdf.text?.trim()

        if (!text) {
            return NextResponse.json(
                { error: "Could not extract any text from the PDF. Make sure it contains selectable text (not scanned images)." },
                { status: 422 },
            )
        }

        const questions = parseStructuredText(text)

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
