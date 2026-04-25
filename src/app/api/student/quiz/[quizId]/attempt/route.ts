import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  createQuizAttempt,
  submitQuizAttempt,
} from "@/features/student/lib/quiz-data";

export async function POST(
  request: NextRequest,
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

  const body = (await request.json()) as {
    action: "start" | "submit";
    attemptId?: string;
    answers?: Array<{ questionId: string; selectedOptionId: string }>;
  };

  if (body.action === "start") {
    const attemptId = await createQuizAttempt(supabase, user.id, quizId);
    if (!attemptId) {
      return NextResponse.json(
        { error: "Could not create quiz attempt" },
        { status: 500 },
      );
    }
    return NextResponse.json({ attemptId });
  }

  if (body.action === "submit") {
    if (!body.attemptId || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: "Missing attemptId or answers" },
        { status: 400 },
      );
    }

    const result = await submitQuizAttempt(
      supabase,
      user.id,
      body.attemptId,
      body.answers,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Could not submit quiz" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
