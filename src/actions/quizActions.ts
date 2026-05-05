"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createQuiz, updateQuiz, deleteQuiz, togglePublish } from "@/lib/supabase/queries/quizzes";
import { reorderQuestions } from "@/lib/supabase/queries/questions";
import type { QuizFormData } from "@/types/quiz";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function createQuizAction(data: QuizFormData) {
  const supabase = await getSupabase();
  return createQuiz(supabase, data as any);
}

export async function updateQuizAction(id: string, data: Partial<QuizFormData>) {
  const supabase = await getSupabase();
  return updateQuiz(supabase, id, data as any);
}

export async function deleteQuizAction(id: string) {
  const supabase = await getSupabase();
  return deleteQuiz(supabase, id);
}

export async function publishQuizAction(id: string, published: boolean) {
  const supabase = await getSupabase();
  return togglePublish(supabase, id, published);
}

export async function duplicateQuizAction(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/quiz/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Duplication failed");
  return res.json();
}

export async function reorderQuestionsAction(quizId: string, orderedIds: string[]) {
  const supabase = await getSupabase();
  return reorderQuestions(supabase, quizId, orderedIds);
}
