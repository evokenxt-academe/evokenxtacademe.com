"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Menu, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { signOutUser } from "@/features/auth/lib/sign-out";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DashboardSearchCommand,
  type DashboardSearchItem,
} from "@/components/dashboard-search-command";
import { useDashboardSearchItems } from "@/components/dashboard-search-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  Award,
  Compass,
  Settings2,
} from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/my-courses": "My Courses",
  "/dashboard/tests": "Quizzes",
  "/dashboard/certificates": "Certificates",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/payments": "Payments",
  "/dashboard/student/live": "Live Sessions",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  const match = Object.entries(PAGE_TITLES).find(
    ([path]) => path !== "/dashboard" && pathname.startsWith(path),
  );
  return match?.[1] ?? "Dashboard";
}

const sheetNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { title: "Live Sessions", href: "/dashboard/student/live", icon: Video },
  { title: "Quizzes", href: "/dashboard/tests", icon: ClipboardList },
  { title: "Certificates", href: "/dashboard/certificates", icon: Award },
  { title: "Explore", href: "/courses", icon: Compass },
  { title: "Settings", href: "/dashboard/settings", icon: Settings2 },
];

interface DashboardNavbarProps {
  user: {
    id?: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role?: string | null;
  } | null;
  minimal?: boolean;
  backUrl?: string;
}

export function DashboardNavbar({
  user,
  minimal = false,
  backUrl,
}: DashboardNavbarProps) {
  const { items: searchItems } = useDashboardSearchItems();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  useNotifications(user?.id ?? null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "E";

  const pageTitle = getPageTitle(pathname);

  const handleLogout = async () => {
    await signOutUser("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:h-16 md:px-6">
        {/* Minimal back button */}
        {minimal && (
          <Link
            href={backUrl || "/dashboard"}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-muted/30 hover:bg-muted"
          >
            <ChevronLeft className="size-4" strokeWidth={2.5} />
            <span>Back</span>
          </Link>
        )}

        {/* Mobile menu */}
        {!minimal && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>EvokeNXT</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {sheetNav.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname.startsWith(item.href) && item.href !== "/dashboard"
                      ? true
                      : pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {!minimal && <SidebarTrigger className="hidden md:flex" />}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl transition-all duration-200"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user?.id ? <NotificationBell userId={user.id} /> : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 rounded-xl px-2">
                <Avatar className="size-7">
                  <AvatarImage
                    src={user?.avatar ?? undefined}
                    alt={user?.name ?? "Student"}
                  />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-24 truncate text-sm font-medium sm:inline">
                  {user?.name?.split(" ")[0] || "Student"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {user?.name || "Student"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help")}>
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
