"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { saveBankQuestion, deleteBankQuestion, verifyBankQuestion, bulkVerifyBankQuestions, bulkSetDifficulty } from "@/lib/supabase/queries/bank";
import { addQuestionsFromBank } from "@/lib/supabase/queries/questions";
import type { BankQuestionFormData, DifficultyLevel } from "@/types/quiz";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function saveBankQuestionAction(id: string | null, data: BankQuestionFormData) {
  const supabase = await getSupabase();
  return saveBankQuestion(supabase, id, data);
}

export async function deleteBankQuestionAction(id: string) {
  const supabase = await getSupabase();
  return deleteBankQuestion(supabase, id);
}

export async function verifyQuestionAction(id: string) {
  const supabase = await getSupabase();
  return verifyBankQuestion(supabase, id, true);
}

export async function bulkVerifyAction(ids: string[]) {
  const supabase = await getSupabase();
  return bulkVerifyBankQuestions(supabase, ids);
}

export async function bulkSetDifficultyAction(ids: string[], difficulty: DifficultyLevel) {
  const supabase = await getSupabase();
  return bulkSetDifficulty(supabase, ids, difficulty);
}

export async function addBankQuestionToQuizAction(bankQuestionId: string, quizId: string) {
  const supabase = await getSupabase();
  return addQuestionsFromBank(supabase, quizId, [bankQuestionId]);
}
