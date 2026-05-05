import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    parseAnswerKeyText,
    inferSectionType,
    matchOptionByAnswer,
    type ParsedAnswer,
    type MatchResult,
    type ImportAnswerKeyResult,
} from "@/features/admin/quiz-builder/services/answer-key-parser";

// ─────────────────────────────────────────────────────────────
// POST /api/admin/import-answer-key
//
// Body: multipart/form-data
//   - file: PDF file (answer key)
//   - quizId: string (target quiz)
//
// Returns: ImportAnswerKeyResult
// ─────────────────────────────────────────────────────────────

/** Question row shape from the `questions` table */
interface QuestionRow {
    id: string;
    quiz_id: string;
    question: string;
    marks: number;
    position: number;
    source: string | null;
    answer_text: string | null;
}

/** Option row shape from the `options` table */
interface OptionRow {
    id: string;
    question_id: string;
    text: string;
    is_correct: boolean;
}

export async function POST(request: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) return auth.error;

    const { supabase } = auth;

    // ── Parse form data ──────────────────────────────────────
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json(
            { error: "Invalid form data. Send multipart/form-data with 'file' and 'quizId'." },
            { status: 400 },
        );
    }

    const file = formData.get("file");
    const quizId = formData.get("quizId");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "PDF file is required (field: 'file')." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    if (typeof quizId !== "string" || !quizId.trim()) {
        return NextResponse.json({ error: "'quizId' is required." }, { status: 400 });
    }

    // ── Step 1: Extract text from PDF ────────────────────────
    let pdfText: string;
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parser = new PDFParse({ data: buffer });
        try {
            const pdf = await parser.getText();
            pdfText = pdf.text;
        } finally {
            await parser.destroy();
        }
    } catch (err) {
        console.error("[import-answer-key] PDF parse failed:", err);
        return NextResponse.json({ error: "Failed to read PDF file." }, { status: 422 });
    }

    if (!pdfText.trim()) {
        return NextResponse.json({ error: "PDF contains no extractable text." }, { status: 422 });
    }

    // ── Step 2 & 3: Parse sections and extract answers ───────
    const parsedAnswers = parseAnswerKeyText(pdfText);

    if (parsedAnswers.length === 0) {
        return NextResponse.json(
            { error: "No answers found in the PDF. Expected format: 'Q1 Answer: C'" },
            { status: 422 },
        );
    }

    // ── Step 4: Fetch existing questions for this quiz ────────
    const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, quiz_id, question, marks, position, source, answer_text")
        .eq("quiz_id", quizId.trim())
        .order("position", { ascending: true });

    if (questionsError) {
        console.error("[import-answer-key] Failed to fetch questions:", questionsError);
        return NextResponse.json({ error: "Failed to load quiz questions." }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
        return NextResponse.json(
            { error: "No questions found for this quiz. Import questions first." },
            { status: 404 },
        );
    }

    // Build position → question lookup
    const questionByPosition = new Map<number, QuestionRow>();
    for (const q of questions as QuestionRow[]) {
        questionByPosition.set(q.position, q);
    }

    // ── Fetch all options for these questions ─────────────────
    const questionIds = (questions as QuestionRow[]).map((q) => q.id);
    const { data: allOptions, error: optionsError } = await supabase
        .from("options")
        .select("id, question_id, text, is_correct")
        .in("question_id", questionIds);

    if (optionsError) {
        console.error("[import-answer-key] Failed to fetch options:", optionsError);
        return NextResponse.json({ error: "Failed to load question options." }, { status: 500 });
    }

    // Group options by question_id
    const optionsByQuestion = new Map<string, OptionRow[]>();
    for (const opt of (allOptions ?? []) as OptionRow[]) {
        const list = optionsByQuestion.get(opt.question_id) ?? [];
        list.push(opt);
        optionsByQuestion.set(opt.question_id, list);
    }

    // ── Step 5 & 6: Process each parsed answer ───────────────
    const details: MatchResult[] = [];
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const parsed of parsedAnswers) {
        const result = await processAnswer(parsed, questionByPosition, optionsByQuestion, supabase);
        details.push(result);

        switch (result.status) {
            case "updated":
                updated++;
                break;
            case "failed":
                failed++;
                break;
            case "skipped":
                skipped++;
                break;
        }
    }

    // ── Return result ────────────────────────────────────────
    const result: ImportAnswerKeyResult = {
        totalParsed: parsedAnswers.length,
        totalMatched: updated + failed,
        updated,
        failed,
        skipped,
        details,
    };

    return NextResponse.json(result);
}

// ─────────────────────────────────────────────────────────────
// Process a single parsed answer against the DB
// ─────────────────────────────────────────────────────────────

async function processAnswer(
    parsed: ParsedAnswer,
    questionByPosition: Map<number, QuestionRow>,
    optionsByQuestion: Map<string, OptionRow[]>,
    supabase: ReturnType<typeof import("@/utils/supabase/adminClient").createAdminClient>,
): Promise<MatchResult> {
    const { questionNumber, answer, sectionName } = parsed;

    // Find matching question by position
    const question = questionByPosition.get(questionNumber);

    if (!question) {
        return {
            questionId: "",
            position: questionNumber,
            status: "skipped",
            reason: `No question found at position ${questionNumber}`,
        };
    }

    const sectionType = inferSectionType(sectionName);
    const options = optionsByQuestion.get(question.id) ?? [];

    // ── MCQ / True-False: match option and set is_correct ────
    if (sectionType === "mcq" || sectionType === "true_false" || sectionType === "unknown") {
        // If this question has options, try to match against them
        if (options.length > 0) {
            return await updateMcqAnswer(question, options, answer, supabase);
        }

        // No options → fall through to free-text storage
    }

    // ── Fill / Number / Subjective: store in answer_text ─────
    return await updateFreeTextAnswer(question, answer, supabase);
}

/**
 * For MCQ-type questions: reset all options to is_correct=false,
 * then set the matched option to is_correct=true.
 */
async function updateMcqAnswer(
    question: QuestionRow,
    options: OptionRow[],
    answer: string,
    supabase: ReturnType<typeof import("@/utils/supabase/adminClient").createAdminClient>,
): Promise<MatchResult> {
    const matchedOptionId = matchOptionByAnswer(answer, options);

    if (!matchedOptionId) {
        // Can't match a letter/text to any option — store as free text instead
        return await updateFreeTextAnswer(question, answer, supabase);
    }

    // Step 1: Reset all options for this question to is_correct=false
    const { error: resetError } = await supabase
        .from("options")
        .update({ is_correct: false })
        .eq("question_id", question.id);

    if (resetError) {
        console.error(`[import-answer-key] Reset options failed for Q${question.position}:`, resetError);
        return {
            questionId: question.id,
            position: question.position,
            status: "failed",
            reason: `DB error resetting options: ${resetError.message}`,
        };
    }

    // Step 2: Set the matched option to is_correct=true
    const { error: updateError } = await supabase
        .from("options")
        .update({ is_correct: true })
        .eq("id", matchedOptionId);

    if (updateError) {
        console.error(`[import-answer-key] Update option failed for Q${question.position}:`, updateError);
        return {
            questionId: question.id,
            position: question.position,
            status: "failed",
            reason: `DB error setting correct option: ${updateError.message}`,
        };
    }

    const matchedOption = options.find((o) => o.id === matchedOptionId);
    return {
        questionId: question.id,
        position: question.position,
        status: "updated",
        reason: `Marked option "${matchedOption?.text ?? matchedOptionId}" as correct`,
        appliedAnswer: answer,
    };
}

/**
 * For non-MCQ types (fill, number, subjective): store answer
 * in the questions.answer_text column.
 */
async function updateFreeTextAnswer(
    question: QuestionRow,
    answer: string,
    supabase: ReturnType<typeof import("@/utils/supabase/adminClient").createAdminClient>,
): Promise<MatchResult> {
    const { error } = await supabase
        .from("questions")
        .update({ answer_text: answer.trim() })
        .eq("id", question.id);

    if (error) {
        console.error(`[import-answer-key] Update answer_text failed for Q${question.position}:`, error);
        return {
            questionId: question.id,
            position: question.position,
            status: "failed",
            reason: `DB error updating answer_text: ${error.message}`,
        };
    }

    return {
        questionId: question.id,
        position: question.position,
        status: "updated",
        reason: `Stored answer_text = "${answer.trim()}"`,
        appliedAnswer: answer.trim(),
    };
}
