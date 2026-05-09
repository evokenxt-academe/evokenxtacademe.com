import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import type { ParsedQuestion } from "@/features/admin/quiz-builder/types";
import { parseQuestionsFromRawText } from "@/lib/parsers/regexQuizPdfParser";
import { buildR2ObjectKey, uploadBufferToR2 } from "@/lib/cloudflare/r2";
import { extractTextFromPdf } from "@/lib/pdf/extract";

type RouteParams = { params: Promise<{ quizId: string }> };

function normalizeSelectedIndices(
  selected: FormDataEntryValue | null,
  parsedCount: number
): number[] {
  if (!selected || typeof selected !== "string") {
    return Array.from({ length: parsedCount }, (_, i) => i);
  }

  const indices = selected
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < parsedCount);
  return Array.from(new Set(indices));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) return auth.error;

  const { quizId } = await params;
  const { supabase, userId } = auth;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 }
    );
  }

  const fileArrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(fileArrayBuffer);

  const r2Key = buildR2ObjectKey({
    folder: "course-resources/quiz-imports",
    userId,
    title: file.name,
    ext: "pdf",
  });
  const uploadedFile = await uploadBufferToR2({
    key: r2Key,
    body: fileArrayBuffer,
    contentType: "application/pdf",
  });

  const extractedText = (await extractTextFromPdf(fileBuffer)).trim();

  if (!extractedText) {
    return NextResponse.json(
      {
        error:
          "Could not extract text from the uploaded PDF. Ensure it contains selectable text.",
      },
      { status: 422 }
    );
  }

  const parsedQuestions = parseQuestionsFromRawText(extractedText);
  if (parsedQuestions.length === 0) {
    return NextResponse.json(
      { error: "No questions were detected in the PDF." },
      { status: 422 }
    );
  }

  const selectedIndices = normalizeSelectedIndices(
    formData.get("selectedIndices"),
    parsedQuestions.length
  );
  const selectedQuestions = selectedIndices
    .map((idx) => parsedQuestions[idx])
    .filter((q): q is ParsedQuestion => Boolean(q));

  if (selectedQuestions.length === 0) {
    return NextResponse.json(
      { error: "No valid questions selected for import." },
      { status: 400 }
    );
  }

  const bankRows = selectedQuestions.map((q) => ({
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
    .select("*");

  if (insertBankError || !insertedQuestions) {
    return NextResponse.json(
      { error: insertBankError?.message ?? "Failed to insert question bank rows" },
      { status: 500 }
    );
  }

  const optionInserts = insertedQuestions.flatMap((row, idx) => {
    const options = selectedQuestions[idx]?.options ?? [];
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
    if (optionError) {
      return NextResponse.json({ error: optionError.message }, { status: 500 });
    }
  }

  const { data: maxPositionRow } = await supabase
    .from("quiz_questions")
    .select("position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextPosition = (maxPositionRow?.position ?? -1) + 1;
  const quizQuestionInserts = insertedQuestions.map((row) => ({
    quiz_id: quizId,
    question_id: row.id,
    position: nextPosition++,
  }));

  const { error: quizQuestionError } = await supabase
    .from("quiz_questions")
    .insert(quizQuestionInserts);

  if (quizQuestionError) {
    return NextResponse.json({ error: quizQuestionError.message }, { status: 500 });
  }

  const { data: quizQuestionRows, error: quizQuestionFetchError } = await supabase
    .from("quiz_questions")
    .select("question_bank(marks)")
    .eq("quiz_id", quizId);
  if (quizQuestionFetchError) {
    return NextResponse.json({ error: quizQuestionFetchError.message }, { status: 500 });
  }
  const totalMarks = (quizQuestionRows ?? []).reduce((sum, row) => {
    const marksValue = (row.question_bank as { marks?: number } | null)?.marks ?? 1;
    return sum + marksValue;
  }, 0);
  const { error: updateQuizError } = await supabase
    .from("quizzes")
    .update({ total_marks: totalMarks })
    .eq("id", quizId);
  if (updateQuizError) {
    return NextResponse.json({ error: updateQuizError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    total: insertedQuestions.length,
    questions: selectedQuestions,
    fileUrl: uploadedFile.publicUrl,
  });
}
