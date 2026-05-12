"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconBook,

  
  IconLivePhoto,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "Learn",
    href: "/my-courses",
    icon: IconBook,
  },
  {
    title: "Live",
    href: "/dashboard/student/live",
    icon: IconLivePhoto,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: IconUser,
  },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === "/my-courses") {
      return pathname.startsWith("/my-courses") || pathname.startsWith("/learn/");
    }
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    if (href !== "/dashboard" && pathname.startsWith(href)) {
      return true;
    }
    return pathname === href;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] items-center justify-around border-t border-border/60 bg-background/80 backdrop-blur-xl px-2 sm:hidden">
      {mobileNavItems.map((item) => {
        const isActive = isRouteActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-[#193CB8] dark:text-[#00C950]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 transition-transform",
                isActive ? "scale-110 mb-0.5" : "mb-0.5"
              )}
              stroke={isActive ? 2.5 : 1.5}
            />
            <span className="text-[10px] font-medium">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
