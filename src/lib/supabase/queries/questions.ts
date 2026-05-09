/**
 * Question + Options CRUD Queries
 * ================================
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionWithOptions, QuestionFormData } from "@/types/quiz";

export async function getQuestionsByQuizId(
  supabase: SupabaseClient,
  quizId: string
): Promise<QuestionWithOptions[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      `*,
       options:question_options(*)
      `
    )
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[questions] getByQuizId error:", error.message);
    return [];
  }

  return (data ?? []).map((q: any) => ({
    ...q,
    options: (q.options ?? []).sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
    ),
  }));
}

export async function getQuestionById(
  supabase: SupabaseClient,
  questionId: string
): Promise<QuestionWithOptions | null> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      `*,
       options:question_options(*),
       bank_link:quiz_bank_links(*)
      `
    )
    .eq("id", questionId)
    .single();

  if (error || !data) {
    console.error("[questions] getById error:", error?.message || "Not found");
    return null;
  }

  return {
    ...data,
    options: (data.options ?? []).sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
    ),
    bank_link: Array.isArray(data.bank_link)
      ? data.bank_link[0] ?? null
      : data.bank_link,
  } as QuestionWithOptions;
}

export async function saveQuestion(
  supabase: SupabaseClient,
  quizId: string,
  questionId: string | null,
  data: QuestionFormData
): Promise<{ id: string }> {
  const { options, model_answer, ...questionData } = data;

  if (questionId) {
    // Update existing question
    const { error: qError } = await supabase
      .from("questions")
      .update({
        ...questionData,
        quiz_id: quizId,
      })
      .eq("id", questionId);

    if (qError) throw new Error(qError.message);

    // Delete old options, insert new
    if (options && options.length > 0) {
      await supabase
        .from("question_options")
        .delete()
        .eq("question_id", questionId);

      const { error: oError } = await supabase
        .from("question_options")
        .insert(
          options.map((opt, i) => ({
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            position: opt.position ?? i,
            explanation: opt.explanation ?? null,
          }))
        );

      if (oError) throw new Error(oError.message);
    }

    return { id: questionId };
  } else {
    // Get next position
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId);

    const nextPos = (count ?? 0) + 1;

    // Insert new question
    const { data: newQ, error: qError } = await supabase
      .from("questions")
      .insert([
        {
          ...questionData,
          quiz_id: quizId,
          position: nextPos,
        },
      ])
      .select("id")
      .single();

    if (qError) throw new Error(qError.message);

    // Insert options
    if (options && options.length > 0) {
      const { error: oError } = await supabase
        .from("question_options")
        .insert(
          options.map((opt, i) => ({
            question_id: newQ.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            position: opt.position ?? i,
            explanation: opt.explanation ?? null,
          }))
        );

      if (oError) throw new Error(oError.message);
    }

    return { id: newQ.id };
  }
}

export async function deleteQuestion(
  supabase: SupabaseClient,
  questionId: string
) {
  // Options cascade via FK
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) throw new Error(error.message);
}

export async function reorderQuestions(
  supabase: SupabaseClient,
  quizId: string,
  orderedIds: string[]
) {
  // Batch update positions
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("questions")
      .update({ position: index + 1 })
      .eq("id", id)
      .eq("quiz_id", quizId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function batchInsertQuestions(
  supabase: SupabaseClient,
  quizId: string,
  questions: QuestionFormData[]
) {
  const startPos =
    (
      await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId)
    ).count ?? 0;

  const inserted: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const { options, model_answer, ...qData } = questions[i];

    const { data: newQ, error: qErr } = await supabase
      .from("questions")
      .insert([
        {
          ...qData,
          quiz_id: quizId,
          position: startPos + i + 1,
        },
      ])
      .select("id")
      .single();

    if (qErr) {
      console.error(`[questions] batch insert #${i} error:`, qErr.message);
      continue;
    }

    if (options && options.length > 0) {
      await supabase.from("question_options").insert(
        options.map((opt, j) => ({
          question_id: newQ.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          position: opt.position ?? j,
          explanation: opt.explanation ?? null,
        }))
      );
    }

    inserted.push(newQ.id);
  }

  return { inserted: inserted.length, ids: inserted };
}

export async function addQuestionsFromBank(
  supabase: SupabaseClient,
  quizId: string,
  bankQuestionIds: string[]
) {
  const startPos =
    (
      await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId)
    ).count ?? 0;

  const inserted: string[] = [];

  for (let i = 0; i < bankQuestionIds.length; i++) {
    const bankId = bankQuestionIds[i];

    // Fetch bank question + options
    const { data: bq, error: bErr } = await supabase
      .from("bank_questions")
      .select("*, options:bank_question_options(*)")
      .eq("id", bankId)
      .single();

    if (bErr || !bq) continue;

    // Insert as quiz question
    const { data: newQ, error: qErr } = await supabase
      .from("questions")
      .insert([
        {
          quiz_id: quizId,
          type: bq.type,
          question_text: bq.question_text,
          question_image_url: bq.question_image_url,
          explanation: bq.explanation,
          explanation_image_url: bq.explanation_image_url,
          source_ref: bq.source_ref,
          marks: bq.marks,
          negative_marks: bq.negative_marks,
          position: startPos + i + 1,
          is_mandatory: true,
          assertion_text: bq.assertion_text,
          reason_text: bq.reason_text,
          numerical_answer: bq.numerical_answer,
          numerical_tolerance: bq.numerical_tolerance,
        },
      ])
      .select("id")
      .single();

    if (qErr || !newQ) continue;

    // Copy options
    const bankOpts = bq.options ?? [];
    if (bankOpts.length > 0) {
      await supabase.from("question_options").insert(
        bankOpts.map((opt: any) => ({
          question_id: newQ.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          position: opt.position,
          explanation: opt.explanation,
        }))
      );
    }

    // Create bank link
    await supabase.from("quiz_bank_links").insert([
      {
        quiz_id: quizId,
        quiz_question_id: newQ.id,
        bank_question_id: bankId,
        is_synced: true,
        linked_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      },
    ]);

    // Increment usage count
    const { error: rpcErr } = await supabase.rpc("increment_usage_count", { bq_id: bankId });
    if (rpcErr) {
      // Fallback if RPC doesn't exist or fails
      await supabase
        .from("bank_questions")
        .update({ usage_count: (bq.usage_count ?? 0) + 1 })
        .eq("id", bankId);
    }

    inserted.push(newQ.id);
  }

  return { inserted: inserted.length, ids: inserted };
}
