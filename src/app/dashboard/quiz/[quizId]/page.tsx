import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { fetchQuizForAttempt } from "@/features/student/lib/quiz-data";
import { QuizPlayer } from "@/features/student/components/quiz-player";

interface Props {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const quiz = await fetchQuizForAttempt(supabase, user.id, quizId);

  if (!quiz) {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 md:p-6">
      <QuizPlayer quiz={quiz} />
    </div>
  );
}
