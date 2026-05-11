import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { createClient } from "@/utils/supabase/server";
import { fetchStudentShellProfile } from "@/features/student/lib/student-shell";

export default async function DashboardLayout({
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

  const navbarUser = {
    id: user.id,
    name: sidebarUser.name,
    email: sidebarUser.email,
    avatar: sidebarUser.avatar,
  };

  return (
    <SidebarProvider>
      <DashboardSidebar user={sidebarUser} />
      <SidebarInset className="bg-background pb-16 sm:pb-0">
        <DashboardNavbar user={navbarUser} />
        {children}
      </SidebarInset>
      <DashboardMobileNav />
    </SidebarProvider>
  );
}
