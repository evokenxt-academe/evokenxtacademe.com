"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  TrendingUp,
  Award,
  Compass,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StudentProfile } from "@/features/student/lib/lms-data";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { title: "Test", href: "/dashboard/tests", icon: ClipboardList },
  { title: "Certificates", href: "/dashboard/certificates", icon: Award },
  { title: "Explore", href: "/courses", icon: Compass },
  { title: "Settings", href: "/dashboard/settings", icon: Settings2 },
];

interface DashboardSidebarProps {
  user: StudentProfile | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const isRouteActive = (href: string) => {
    if (href === "/dashboard#overall-progress") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/my-courses") {
      return (
        pathname.startsWith("/dashboard/my-courses") ||
        pathname.startsWith("/learn/")
      );
    }
    if (href === "/courses") {
      return pathname.startsWith("/courses");
    }
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    if (
      href !== "/dashboard" &&
      !href.includes("#") &&
      pathname.startsWith(href)
    ) {
      return true;
    }
    return pathname === href;
  };



  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "EN";

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="hidden md:flex [--sidebar-width:15rem]"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="EvokeNXT Home">
              <Link href="/dashboard">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                  E
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold">EvokeNXT</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Student LMS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isRouteActive(item.href);
                const Icon = item.icon;
                const link = (
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      active &&
                        "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                );
                return (
                  <SidebarMenuItem key={item.title}>{link}</SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none rounded-xl"
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={user?.avatar ?? undefined}
                  alt={user?.name ?? "Student"}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {user?.name || "Student"}
                </span>
                <Badge variant="secondary" className="mt-0.5 w-fit text-[10px]">
                  {user?.role ?? "Student"}
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={toggleSidebar}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronLeft className="size-4" />
                  )}
                  {collapsed ? "Expand" : "Collapse"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle sidebar</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
