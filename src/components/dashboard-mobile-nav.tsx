"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Compass, ClipboardList, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const mobileNavItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { title: "Explore", href: "/courses", icon: Compass },
  { title: "Quizzes", href: "/dashboard/tests", icon: ClipboardList },
  { title: "Profile", href: "/dashboard/profile", icon: User },
];

export function DashboardMobileNav() {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const isDashboardRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/learn") ||
    pathname?.startsWith("/my-courses") ||
    pathname?.startsWith("/courses");

  if (!isMobile || !isDashboardRoute) {
    return null;
  }

  const isRouteActive = (href: string) => {
    if (href === "/dashboard/my-courses") {
      return pathname.startsWith("/dashboard/my-courses") || pathname.startsWith("/learn/");
    }
    if (href === "/courses") {
      return pathname.startsWith("/courses");
    }
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    if (href !== "/dashboard" && pathname.startsWith(href)) {
      return true;
    }
    return pathname === href;
  };

  const activeIndex = mobileNavItems.findIndex((item) => isRouteActive(item.href));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="relative flex h-16 items-stretch justify-around px-1">
        {activeIndex >= 0 ? (
          <motion.div
            className="absolute top-0 h-0.5 bg-primary"
            layoutId="bottom-nav-indicator"
            style={{
              width: `${100 / mobileNavItems.length}%`,
              left: `${(activeIndex * 100) / mobileNavItems.length}%`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        ) : null}
        {mobileNavItems.map((item) => {
          const isActive = isRouteActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", isActive && "scale-110")} aria-hidden />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
