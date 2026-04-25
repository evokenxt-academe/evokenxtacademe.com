import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchQuizForAttempt } from "@/features/student/lib/quiz-data";

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

  const quiz = await fetchQuizForAttempt(supabase, user.id, quizId);

  if (!quiz) {
    return NextResponse.json(
      { error: "Quiz not found or not authorized" },
      { status: 404 },
    );
  }

  return NextResponse.json(quiz);
}
