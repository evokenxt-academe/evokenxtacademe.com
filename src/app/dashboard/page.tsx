import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { fetchStudentDashboardV21 } from "./_lib/dashboard-data";
import { buildDashboardViewModel } from "./_lib/dashboard-view-model";
import { DashboardClient } from "./_components/dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies; middleware refresh handles it.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const data = await fetchStudentDashboardV21(supabase, user.id);
  const viewModel = buildDashboardViewModel(data);

  return <DashboardClient data={viewModel} />;
}
