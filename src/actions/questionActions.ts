"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { saveQuestion, deleteQuestion, addQuestionsFromBank } from "@/lib/supabase/queries/questions";
import type { QuestionFormData } from "@/types/quiz";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function saveQuestionAction(quizId: string, questionId: string | null, data: QuestionFormData) {
  const supabase = await getSupabase();
  return saveQuestion(supabase, quizId, questionId, data);
}

export async function deleteQuestionAction(questionId: string) {
  const supabase = await getSupabase();
  return deleteQuestion(supabase, questionId);
}

export async function addFromBankAction(quizId: string, bankIds: string[]) {
  const supabase = await getSupabase();
  return addQuestionsFromBank(supabase, quizId, bankIds);
}

export async function syncFromBankAction(quizQuestionId: string) {
  const supabase = await getSupabase();

  // Get the bank link
  const { data: link } = await supabase.from("quiz_bank_links").select("*").eq("quiz_question_id", quizQuestionId).single();
  if (!link) throw new Error("No bank link found");

  // Get bank question
  const { data: bq } = await supabase.from("bank_questions").select("*, options:bank_question_options(*)").eq("id", link.bank_question_id).single();
  if (!bq) throw new Error("Bank question not found");

  // Update quiz question
  await supabase.from("questions").update({
    type: bq.type, question_text: bq.question_text, question_image_url: bq.question_image_url,
    explanation: bq.explanation, explanation_image_url: bq.explanation_image_url,
    source_ref: bq.source_ref, marks: bq.marks, negative_marks: bq.negative_marks,
    assertion_text: bq.assertion_text, reason_text: bq.reason_text,
    numerical_answer: bq.numerical_answer, numerical_tolerance: bq.numerical_tolerance,
    model_answer: bq.model_answer,
  }).eq("id", quizQuestionId);

  // Replace options
  await supabase.from("question_options").delete().eq("question_id", quizQuestionId);
  const opts = (bq as any).options ?? [];
  if (opts.length > 0) {
    await supabase.from("question_options").insert(
      opts.map((o: any) => ({ question_id: quizQuestionId, option_text: o.option_text, is_correct: o.is_correct, position: o.position, explanation: o.explanation }))
    );
  }

  // Update link
  await supabase.from("quiz_bank_links").update({ is_synced: true, last_synced_at: new Date().toISOString() }).eq("id", link.id);
}
