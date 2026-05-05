import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { QuizEngine, type PreviousAttempt, type QuizMeta, type QuizQuestion } from "./QuizEngine";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ quizId: string }>;
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `id, title, description, instructions,
       type, total_marks, passing_marks,
       time_limit_sec, shuffle_questions, shuffle_options, max_attempts,
       show_answers_after,
       course:courses!inner(title, slug, id)`,
    )
    .eq("id", quizId)
    .eq("is_published", true)
    .maybeSingle();

  if (quizError || !quiz) redirect("/dashboard");

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", (quiz.course as { id: string }).id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect("/courses");

  const [{ data: questions }, { data: attempts }] = await Promise.all([
    supabase
      .from("questions")
      .select(
        `id, type, question_text,
         marks, negative_marks, position,
         blank_placeholder, assertion_text, reason_text,
         numerical_answer, numerical_tolerance,
         is_mandatory,
         options:question_options(id, option_text, position)`,
      )
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select(
        "id, score, total_marks, percentage, passed, status, attempt_number, started_at, submitted_at, time_spent_sec",
      )
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false }),
  ]);

  return (
    <div className="px-4 py-6 md:px-6">
      <QuizEngine
        userId={user.id}
        quiz={quiz as unknown as QuizMeta}
        questions={(questions ?? []) as unknown as QuizQuestion[]}
        attempts={(attempts ?? []) as unknown as PreviousAttempt[]}
      />
    </div>
  );
}

