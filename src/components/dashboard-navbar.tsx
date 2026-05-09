"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconBell,
  IconMoon,
  IconSun,
  IconMenu2,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardNavbarProps {
  user: {
    id?: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Register FCM token + listen for foreground notifications
  useNotifications(user?.id ?? null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "E";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
     <div className="flex items-center gap-1 w-full">
      <SidebarTrigger className="-ml-1" />
     </div>

   
      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <IconSun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <IconMoon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        {user?.id && <NotificationBell userId={user.id} />}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 h-9 gap-2 rounded-2xl px-2 hover:bg-accent"
            >
              <Avatar className="size-7">
                <AvatarImage src={user?.avatar ?? undefined} />
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
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "Student"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/certificates")}>
              Certificates
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/payments")}>
              Payments
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
