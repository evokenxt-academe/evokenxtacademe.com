import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminHeader } from "@/features/admin/components/admin-header";
import { createClient } from "@/utils/supabase/server";
import { autoEnrollUserInAllCourses } from "@/lib/auth/enrollment-sync";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if ((profile as any)?.role === "admin" || (profile as any)?.role === "instructor") {
      await autoEnrollUserInAllCourses(user.id, (profile as any).role);
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/30">
        <AdminHeader />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
