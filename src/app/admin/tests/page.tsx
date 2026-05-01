import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminTestPage } from "@/features/tests/components/admin-test-page";

export default async function AdminTestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <AdminTestPage />;
}
