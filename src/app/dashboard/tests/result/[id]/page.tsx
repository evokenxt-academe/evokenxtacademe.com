import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ResultPage } from "@/features/tests/components/result-page";

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <ResultPage attemptId={id} />;
}
