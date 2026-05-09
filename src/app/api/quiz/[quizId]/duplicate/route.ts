import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function getSupabase() {
  return await createClient();
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const supabase = await getSupabase();

    // Fetch original quiz
    const { data: quiz, error: qErr } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
    if (qErr || !quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Create copy
    const sourceQuiz = quiz as any;
    const { id: _id, created_at: _ca, updated_at: _ua, total_marks: _tm, ...quizData } = sourceQuiz;
    const { data: newQuiz, error: nErr } = await (supabase.from("quizzes") as any)
      .insert([{ ...quizData, title: `${sourceQuiz.title} (Copy)`, is_published: false }])
      .select("id").single();
    if (nErr) throw new Error(nErr.message);

    // Copy questions
    const { data: questions } = await supabase.from("questions").select("*, options:question_options(*)").eq("quiz_id", quizId).order("position");

    for (const q of questions ?? []) {
      const { id: _qid, quiz_id: _qzid, created_at: _qca, options, ...qData } = q as any;
      const { data: newQ, error: nqErr } = await (supabase.from("questions") as any).insert([{ ...qData, quiz_id: newQuiz.id }]).select("id").single();
      if (nqErr || !newQ) continue;

      const opts = options ?? [];
      if (opts.length > 0) {
        await (supabase.from("question_options") as any).insert(
          opts.map((o: any) => ({ question_id: newQ.id, option_text: o.option_text, is_correct: o.is_correct, position: o.position, explanation: o.explanation }))
        );
      }
    }

    return NextResponse.json({ newQuizId: newQuiz.id });
  } catch (error: any) {
    console.error("[quiz/duplicate] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
