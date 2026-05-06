import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", (quiz.course as { id: string }).id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
  }

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

  return NextResponse.json({ quiz, questions: questions ?? [], attempts: attempts ?? [] });
}
