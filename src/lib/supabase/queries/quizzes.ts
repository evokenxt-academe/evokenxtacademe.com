/**
 * Quiz CRUD Queries
 * =================
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quiz, QuizWithRelations, QuizSummary, QuizDashboardStats } from "@/types/quiz";

export async function getAllQuizzes(
  supabase: SupabaseClient,
  filters?: {
    search?: string;
    program?: string;
    type?: string;
    status?: string;
  }
) {
  let query = supabase
    .from("quizzes")
    .select(
      `id, title, description, type, total_marks, passing_marks, time_limit_sec,
       shuffle_questions, shuffle_options, max_attempts, show_answers_after,
       is_published, created_at,
       course:courses!inner(
         id, title, slug,
         subject:subjects!inner(
           id, code, name,
           program_level:program_levels!inner(
             id, label,
             program:programs!inner(id, body)
           )
         )
       ),
       chapter:chapters(id, title),
       questions(id),
       quiz_attempts(id, score, percentage)`
    )
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.status === "published") {
    query = query.eq("is_published", true);
  } else if (filters?.status === "draft") {
    query = query.eq("is_published", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[quizzes] getAllQuizzes error:", error.message);
    return [];
  }

  let results = data ?? [];

  // Client-side filter for program (joined through course → subject → program_level → program)
  if (filters?.program) {
    results = results.filter((q: any) => {
      const body = q.course?.subject?.program_level?.program?.body;
      return body === filters.program;
    });
  }

  return results.map((quiz: any) => {
    const attempts = quiz.quiz_attempts ?? [];
    const avgScore =
      attempts.length > 0
        ? attempts.reduce((sum: number, a: any) => sum + (a.percentage ?? 0), 0) / attempts.length
        : null;

    return {
      id: quiz.id,
      title: quiz.title,
      type: quiz.type,
      is_published: quiz.is_published,
      total_marks: quiz.total_marks ?? 0,
      time_limit_sec: quiz.time_limit_sec,
      passing_marks: quiz.passing_marks,
      question_count: (quiz.questions ?? []).length,
      attempt_count: attempts.length,
      avg_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
      course_title: quiz.course?.title ?? null,
      program_body: quiz.course?.subject?.program_level?.program?.body ?? null,
      level_label: quiz.course?.subject?.program_level?.label ?? null,
      subject_name: quiz.course?.subject?.name ?? null,
      created_at: quiz.created_at,
      updated_at: quiz.created_at, // Fallback since column doesn't exist
    } as QuizSummary & { subject_name: string | null };
  });
}

export async function getQuizById(supabase: SupabaseClient, quizId: string) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `*,
       course:courses(
         id, title, slug, subject_id,
         subject:subjects(
           id, code, name,
           program_level:program_levels(
             id, label,
             program:programs(id, body, full_name)
           )
         )
       ),
       chapter:chapters(id, title)`
    )
    .eq("id", quizId)
    .single();

  if (error) {
    console.error("[quizzes] getQuizById error:", error.message);
    return null;
  }
  return data as QuizWithRelations;
}

export async function createQuiz(
  supabase: SupabaseClient,
  data: Partial<Quiz>
): Promise<{ id: string } | null> {
  const { data: result, error } = await supabase
    .from("quizzes")
    .insert([data])
    .select("id")
    .single();

  if (error) {
    console.error("[quizzes] createQuiz error:", error.message);
    throw new Error(error.message);
  }
  return result;
}

export async function updateQuiz(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Quiz>
) {
  const { error } = await supabase
    .from("quizzes")
    .update({ ...data })
    .eq("id", id);

  if (error) {
    console.error("[quizzes] updateQuiz error:", error.message);
    throw new Error(error.message);
  }
}

export async function deleteQuiz(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) {
    console.error("[quizzes] deleteQuiz error:", error.message);
    throw new Error(error.message);
  }
}

export async function togglePublish(
  supabase: SupabaseClient,
  id: string,
  published: boolean
) {
  const { error } = await supabase
    .from("quizzes")
    .update({ is_published: published })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getQuizDashboardStats(
  supabase: SupabaseClient
): Promise<QuizDashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [quizzesRes, questionsRes, attemptsRes, weeklyQuizzesRes] =
    await Promise.all([
      supabase.from("quizzes").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("quiz_attempts").select("id, percentage", { count: "exact" }),
      supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
    ]);

  const attempts = attemptsRes.data ?? [];
  const avgScore =
    attempts.length > 0
      ? attempts.reduce((s, a: any) => s + (a.percentage ?? 0), 0) / attempts.length
      : 0;

  return {
    totalQuizzes: quizzesRes.count ?? 0,
    totalQuestions: questionsRes.count ?? 0,
    totalAttempts: attemptsRes.count ?? 0,
    avgScore: Math.round(avgScore * 10) / 10,
    weeklyQuizzes: weeklyQuizzesRes.count ?? 0,
    weeklyQuestions: 0,
    weeklyAttempts: 0,
  };
}

export async function getQuizAttempts(
  supabase: SupabaseClient,
  quizId: string
) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("[quizzes] getQuizAttempts error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getQuizTypeDistribution(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("quizzes")
    .select("type");

  if (error) return [];

  const counts: Record<string, number> = {};
  (data ?? []).forEach((q: any) => {
    counts[q.type] = (counts[q.type] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}
