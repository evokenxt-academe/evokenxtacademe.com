/**
 * Bank Questions CRUD Queries
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankQuestionWithOptions, BankDashboardStats, DifficultyLevel, QuestionType } from "@/types/quiz";

export async function getBankQuestions(
  supabase: SupabaseClient,
  filters?: {
    subject_id?: string; topic_id?: string; sub_topic_id?: string;
    type?: string; difficulty?: string; verified?: string;
    search?: string; offset?: number; limit?: number;
  }
): Promise<{ data: BankQuestionWithOptions[]; count: number }> {
  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;

  let query = supabase
    .from("bank_questions")
    .select(`*, options:bank_question_options(*), topic:topics(id, name), sub_topic:sub_topics(id, name), subject:subjects(id, code, name)`, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.subject_id) query = query.eq("subject_id", filters.subject_id);
  if (filters?.topic_id) query = query.eq("topic_id", filters.topic_id);
  if (filters?.sub_topic_id) query = query.eq("sub_topic_id", filters.sub_topic_id);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters?.verified === "verified") query = query.eq("is_verified", true);
  if (filters?.verified === "unverified") query = query.eq("is_verified", false);
  if (filters?.search) query = query.ilike("question_text", `%${filters.search}%`);

  const { data, error, count } = await query;
  if (error) { console.error("[bank] getBankQuestions error:", error.message); return { data: [], count: 0 }; }

  const mapped = (data ?? []).map((q: any) => ({
    ...q,
    options: (q.options ?? []).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)),
  }));

  return { data: mapped, count: count ?? 0 };
}

export async function getBankQuestionById(supabase: SupabaseClient, id: string): Promise<BankQuestionWithOptions | null> {
  const { data, error } = await supabase
    .from("bank_questions")
    .select(`*, options:bank_question_options(*), topic:topics(id, name), sub_topic:sub_topics(id, name), subject:subjects(id, code, name), stats:bank_question_stats(*)`)
    .eq("id", id).single();

  if (error) { console.error("[bank] getById error:", error.message); return null; }

  return { ...data, options: (data.options ?? []).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)), stats: Array.isArray(data.stats) ? data.stats[0] ?? null : data.stats } as BankQuestionWithOptions;
}

export async function saveBankQuestion(supabase: SupabaseClient, id: string | null, data: any): Promise<{ id: string }> {
  const { options, topic, sub_topic, subject, stats, ...questionData } = data;

  if (id) {
    const { error } = await supabase.from("bank_questions").update({ ...questionData, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);

    if (options && options.length > 0) {
      await supabase.from("bank_question_options").delete().eq("question_id", id);
      const { error: oErr } = await supabase.from("bank_question_options").insert(
        options.map((opt: any, i: number) => ({ question_id: id, option_text: opt.option_text, is_correct: opt.is_correct, position: opt.position ?? i, explanation: opt.explanation ?? null }))
      );
      if (oErr) throw new Error(oErr.message);
    }
    return { id };
  } else {
    const { data: newQ, error } = await supabase.from("bank_questions").insert([questionData]).select("id").single();
    if (error) throw new Error(error.message);

    if (options && options.length > 0) {
      await supabase.from("bank_question_options").insert(
        options.map((opt: any, i: number) => ({ question_id: newQ.id, option_text: opt.option_text, is_correct: opt.is_correct, position: opt.position ?? i, explanation: opt.explanation ?? null }))
      );
    }
    return { id: newQ.id };
  }
}

export async function deleteBankQuestion(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("bank_questions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function verifyBankQuestion(supabase: SupabaseClient, id: string, verified: boolean = true) {
  const { error } = await supabase.from("bank_questions").update({ is_verified: verified, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function bulkVerifyBankQuestions(supabase: SupabaseClient, ids: string[]) {
  const { error } = await supabase.from("bank_questions").update({ is_verified: true, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) throw new Error(error.message);
}

export async function bulkSetDifficulty(supabase: SupabaseClient, ids: string[], difficulty: DifficultyLevel) {
  const { error } = await supabase.from("bank_questions").update({ difficulty, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) throw new Error(error.message);
}

export async function getBankDashboardStats(supabase: SupabaseClient, subjectId?: string): Promise<BankDashboardStats> {
  let query = supabase.from("bank_questions").select("id, type, difficulty, is_verified, topic:topics(name)").eq("is_active", true);
  if (subjectId) query = query.eq("subject_id", subjectId);

  const { data, error } = await query;
  if (error || !data) return { totalQuestions: 0, verifiedCount: 0, unverifiedCount: 0, byType: {} as Record<QuestionType, number>, byDifficulty: {} as Record<DifficultyLevel, number>, topTopics: [] };

  const byType: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  let verified = 0;

  data.forEach((q: any) => {
    byType[q.type] = (byType[q.type] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    if (q.is_verified) verified++;
    const tn = q.topic?.name;
    if (tn) topicCounts[tn] = (topicCounts[tn] || 0) + 1;
  });

  return {
    totalQuestions: data.length, verifiedCount: verified, unverifiedCount: data.length - verified,
    byType: byType as Record<QuestionType, number>, byDifficulty: byDifficulty as Record<DifficultyLevel, number>,
    topTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
  };
}
