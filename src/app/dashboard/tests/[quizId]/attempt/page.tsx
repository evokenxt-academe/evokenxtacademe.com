import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { QuizAttemptPage } from "@/features/tests/components/quiz-attempt-page";

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizAttemptRoute({ params }: PageProps) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <QuizAttemptPage quizId={quizId} />;
}
