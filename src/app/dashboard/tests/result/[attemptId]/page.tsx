import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ResultPage } from "@/features/tests/components/result-page";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function QuizResultRoute({ params }: PageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <ResultPage attemptId={attemptId} />;
}
