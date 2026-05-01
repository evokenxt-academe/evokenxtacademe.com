import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { TestDashboardPage } from "@/features/tests/components/test-dashboard-page";

export default async function TestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <TestDashboardPage />;
}
