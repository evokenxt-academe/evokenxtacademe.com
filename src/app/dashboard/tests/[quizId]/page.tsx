import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { QuizDetailsPage } from "@/features/tests/components/quiz-details-page";

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizDetailsRoute({ params }: PageProps) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <QuizDetailsPage quizId={quizId} />;
}
