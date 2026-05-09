import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import type { ParsedQuestion } from "@/features/admin/quiz-builder/types";
import { parseQuestionsFromRawText } from "@/lib/parsers/regexQuizPdfParser";
import { extractTextFromPdf } from "@/lib/pdf/extract";

type RouteParams = { params: Promise<{ quizId: string }> };

function isPdfFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function isMissingTableError(message?: string): boolean {
  const text = (message ?? "").toLowerCase();
  return text.includes("could not find the table") || text.includes("does not exist");
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) return auth.error;

  const { quizId } = await params;
  const { supabase, userId } = auth;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!isPdfFile(file)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 },
    );
  }

  // Track job status for auditability & support.
  const { data: job, error: jobCreateError } = await supabase
    .from("pdf_import_jobs" as any)
    .insert({
      quiz_id: quizId,
      uploaded_by: userId,
      file_name: file.name,
      status: "processing",
    })
    .select("id")
    .maybeSingle();

  // If the jobs table isn't present yet, we still proceed with import.
  const jobId: string | null =
    (job as { id?: string } | null)?.id ?? null;

  const fail = async (message: string, status = 500) => {
    if (jobId) {
      await supabase
        .from("pdf_import_jobs" as any)
        .update({ status: "failed", error_message: message })
        .eq("id", jobId);
    }
    return NextResponse.json({ error: message }, { status });
  };

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extractedText = (await extractTextFromPdf(fileBuffer)).trim();

    if (!extractedText) {
      return await fail(
        "Could not extract text from the uploaded PDF. Ensure it contains selectable text.",
        422,
      );
    }

    const parsedQuestions = parseQuestionsFromRawText(extractedText);
    if (parsedQuestions.length === 0) {
      return await fail("No questions were detected in the PDF.", 422);
    }

    const bankRows = parsedQuestions.map((q) => ({
      question: q.question.trim(),
      type: q.type,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty,
      tags: q.tags ?? [],
      marks: q.marks ?? 1,
      created_by: userId,
    }));

    const { data: insertedQuestions, error: insertBankError } = await supabase
      .from("question_bank")
      .insert(bankRows)
      .select("id, marks");

    // Fallback path for deployments still on legacy schema (questions/options).
    if (insertBankError && isMissingTableError(insertBankError.message)) {
      const { data: maxRow, error: maxRowError } = await supabase
        .from("questions")
        .select("position")
        .eq("quiz_id", quizId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxRowError) return await fail(maxRowError.message);

      let nextPosition = ((maxRow as { position?: number } | null)?.position ?? -1) + 1;
      const questionRows = parsedQuestions.map((q) => ({
        quiz_id: quizId,
        type: q.type,
        question_text: q.question.trim(),
        explanation: q.explanation ?? null,
        source_ref: file.name,
        marks: q.marks ?? 1,
        position: nextPosition++,
        is_mandatory: true,
      }));

      const { data: insertedLegacy, error: legacyInsertError } = await supabase
        .from("questions")
        .insert(questionRows)
        .select("id, marks");
      if (legacyInsertError || !insertedLegacy) {
        return await fail(legacyInsertError?.message ?? "Failed to insert questions");
      }

      const legacyOptionRows = insertedLegacy.flatMap((row, idx) => {
        const options = parsedQuestions[idx]?.options ?? [];
        return options.map((opt, position) => ({
          question_id: row.id,
          option_text: opt.text,
          is_correct: Boolean(opt.isCorrect),
          position,
          explanation: null,
        }));
      });
      if (legacyOptionRows.length > 0) {
        const { error: optionsError } = await supabase.from("question_options").insert(legacyOptionRows);
        if (optionsError) return await fail(optionsError.message);
      }

      const totalMarks = insertedLegacy.reduce((sum, q) => sum + (q.marks ?? 1), 0);
      await supabase
        .from("quizzes")
        .update({ total_marks: totalMarks })
        .eq("id", quizId);

      if (jobId) {
        await supabase
          .from("pdf_import_jobs" as any)
          .update({
            status: "done",
            total_extracted: insertedLegacy.length,
            error_message: null,
          })
          .eq("id", jobId);
      }

      return NextResponse.json({
        success: true,
        total: insertedLegacy.length,
        questions: parsedQuestions satisfies ParsedQuestion[],
      });
    }

    if (insertBankError || !insertedQuestions) {
      return await fail(
        insertBankError?.message ?? "Failed to insert question bank rows",
      );
    }

    const optionInserts = insertedQuestions.flatMap((row, idx) => {
      const options = parsedQuestions[idx]?.options ?? [];
      return options.map((opt, position) => ({
        question_id: row.id,
        text: opt.text,
        is_correct: Boolean(opt.isCorrect),
        position,
      }));
    });

    if (optionInserts.length > 0) {
      const { error: optionError } = await supabase
        .from("question_bank_options")
        .insert(optionInserts);
      if (optionError) return await fail(optionError.message);
    }

    const { data: maxPositionRow, error: maxPositionError } = await supabase
      .from("quiz_questions")
      .select("position")
      .eq("quiz_id", quizId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxPositionError) return await fail(maxPositionError.message);

    let nextPosition = ((maxPositionRow as any)?.position ?? -1) + 1;
    const quizQuestionRows = insertedQuestions.map((row) => ({
      quiz_id: quizId,
      question_id: row.id,
      position: nextPosition++,
    }));

    const { error: quizQuestionError } = await supabase
      .from("quiz_questions")
      .upsert(quizQuestionRows, {
        onConflict: "quiz_id,question_id",
        ignoreDuplicates: true,
      } as any);
    if (quizQuestionError) return await fail(quizQuestionError.message);

    if (jobId) {
      await supabase
        .from("pdf_import_jobs" as any)
        .update({
          status: "done",
          total_extracted: insertedQuestions.length,
          error_message: null,
        })
        .eq("id", jobId);
    }

    return NextResponse.json({
      success: true,
      total: insertedQuestions.length,
      questions: parsedQuestions satisfies ParsedQuestion[],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected import error";
    return await fail(message);
  }
}

