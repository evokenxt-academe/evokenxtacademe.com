import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { fetchStudentShellProfile } from "@/features/student/lib/student-shell";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await fetchStudentShellProfile(supabase, user.id);
  const sidebarUser = profile ?? {
    id: user.id,
    name: user.user_metadata?.full_name ?? null,
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
    role: null,
  };

  return (
    <SidebarProvider>
      <DashboardSidebar user={sidebarUser} />
      <SidebarInset className="min-h-screen bg-background pb-16 sm:pb-0">
        <main className="min-h-screen w-full bg-background">{children}</main>
      </SidebarInset>
      <DashboardMobileNav />
    </SidebarProvider>
  );
}
