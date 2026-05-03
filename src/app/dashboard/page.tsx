import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { fetchDashboardPageData } from "@/features/student/lib/dashboard-queries";
import { DashboardShell } from "@/features/student/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard — Evoke Edu Global",
  description:
    "Track your learning progress, upcoming sessions, certificates, and recent activity.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dashboardData = await fetchDashboardPageData(supabase, user.id);

  return <DashboardShell initialData={dashboardData} />;
}
