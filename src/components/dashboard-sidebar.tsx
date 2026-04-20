"use client";

import {
  IconLayoutDashboard,
  IconBook,
  IconSettings,
  IconCreditCard,
  IconLogout,
  IconTrophy,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserSession } from "@/features/auth/store/use-user-session";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "My Courses",
    href: "/my-courses",
    icon: IconBook,
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: IconTrophy,
  },
];

const secondaryNav = [
  {
    title: "Billing",
    href: "/billing",
    icon: IconCreditCard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: IconSettings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUserSession();

  const isRouteActive = (href: string) => {
    if (href === "/my-courses") {
      return (
        pathname.startsWith("/my-courses") || pathname.startsWith("/learn/")
      );
    }

    return pathname === href;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getUserInitials = (): string => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "E";
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground transition-transform group-hover:scale-110">
            E
          </div>
          <span className="text-xl font-bold tracking-tighter">EVOKE</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-4 p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Learning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(item.href)}
                    className="rounded-xl transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(item.href)}
                    className="rounded-xl transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon />
                      <span className="font-medium text-muted-foreground">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="size-10">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-bold leading-tight">
              {user?.name || "Student"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <IconLogout />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
