import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { QuizStartPage } from "@/features/tests/components/quiz-start-page";

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizStartRoute({ params }: PageProps) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <QuizStartPage quizId={quizId} />;
}
