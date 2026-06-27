"use client";
import * as React from "react";
import {
  SidebarGroupContent,
  SidebarGroupLabel,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebarLogo } from "@/components/app-sidebar-logo";

import {
  IconArrowBackUp,
  IconBell,
  IconBook,
  IconBrandYoutube,
  IconCertificate,
  IconClipboardList,
  IconCreditCard,
  IconDeviceDesktop,
  IconLayoutDashboard,
  IconLogout,
  IconMessage2,
  IconSchool,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const ADMIN_SIDEBAR_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: IconLayoutDashboard,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Users",
        href: "/admin/total-user",
        icon: IconUsers,
      },
      {
        title: "Instructors",
        href: "/admin/instructor",
        icon: IconSchool,
      },
      {
        title: "Enrollments",
        href: "/admin/enrollments",
        icon: IconCertificate,
      },
      {
        title: "Sessions",
        href: "/admin/sessions",
        icon: IconDeviceDesktop,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Courses",
        href: "/admin/courses",
        icon: IconBook,
      },
      {
        title: "Test Builder",
        href: "/admin/quizzes",
        icon: IconClipboardList,
      },
      {
        title: "YouTube Connect",
        href: "/admin/youtube/connect",
        icon: IconBrandYoutube,
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Payments",
        href: "/admin/payments",
        icon: IconCreditCard,
      },
      {
        title: "Reviews",
        href: "/admin/reviews",
        icon: IconClipboardList,
      },
    ],
  },
  {
    label: "Engage",
    items: [
      {
        title: "Notifications",
        href: "/admin/notifications",
        icon: IconBell,
      },
    ],
  },
];
export function AdminSidebar() {
  const path = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-4 py-4">
        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 shadow-sm">
          <Link href="/admin" className="flex items-center gap-3">
            <AppSidebarLogo size={40} className="rounded-xl shadow-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Evoke LMS Admin
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                Operations control center
              </p>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {ADMIN_SIDEBAR_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        path === item.href || path.startsWith(`${item.href}/`)
                      }
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="space-y-2 px-4 pb-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/">
            <IconArrowBackUp />
            <span>Back to Site</span>
          </Link>
        </Button>
        <AdminLogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminLogoutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { signOutUser } = await import("@/features/auth/lib/sign-out");
      await signOutUser("/");
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <IconLogout className="size-4" />
      <span>{isLoading ? "Signing out…" : "Log out"}</span>
    </Button>
  );
}
