import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";
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

  const adminClient = createAdminClient();
  const quiz = await fetchQuizForAttempt(adminClient, user.id, quizId);

  if (!quiz) {
    return NextResponse.json(
      {
        error:
          "Quiz not found, not published yet, or unavailable for your enrollment.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(quiz);
}
