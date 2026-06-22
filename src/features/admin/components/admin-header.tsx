"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserDropdown } from "@/components/user-dropdown";
import { Fragment } from "react";
import { AdminThemeToggle } from "@/components/admin-theme-toggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { createClient } from "@/utils/supabase/client";

export function AdminHeader() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user id for notifications
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Register FCM token + listen for foreground notifications
  useNotifications(userId);

  // Generate breadcrumb items from pathname — skip UUIDs, use smart labels
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const isUUID = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

    /** Human-readable labels for known route slugs */
    const LABEL_MAP: Record<string, string> = {
      admin: "Dashboard",
      courses: "Courses",
      "live-streams": "Live Streams",
      control: "Control Room",
      analytics: "Analytics",
      edit: "Edit",
      new: "New",
      content: "Content",
      bank: "Question Bank",
      import: "Import",
      quizzes: "Quizzes",
      builder: "Builder",
      preview: "Preview",
      results: "Results",
      enrollments: "Enrollments",
      students: "Students",
      payments: "Payments",
      reviews: "Reviews",
      notifications: "Notifications",
      sessions: "Sessions",
      certificates: "Certificates",
      "total-user": "Users",
      "live-chat": "Live Chat",
      streams: "Streams",
      instructor: "Instructor",
      tests: "Tests",
      youtube: "YouTube",
      chat: "Chat",
    };

    /** Context-aware labels — when a slug follows a UUID, append context */
    const CONTEXTUAL_SUFFIX: Record<string, string> = {
      edit: "Edit",
      control: "Control Room",
      analytics: "Analytics",
      content: "Content",
      builder: "Builder",
      preview: "Preview",
      results: "Results",
      chat: "Chat",
    };

    const items: { label: string; href: string }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Skip UUID segments — they shouldn't appear in the breadcrumb
      if (isUUID(segment)) continue;

      const href = `/${segments.slice(0, i + 1).join("/")}`;
      let label = LABEL_MAP[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      // If this slug directly follows a UUID, check for contextual label
      if (i > 0 && isUUID(segments[i - 1]) && CONTEXTUAL_SUFFIX[segment]) {
        // Find what the UUID refers to by looking at the segment before it
        const parentSlug = i >= 2 ? segments[i - 2] : "";
        const parentLabel =
          parentSlug === "courses"
            ? "Course"
            : parentSlug === "live-streams"
              ? "Stream"
              : parentSlug === "quizzes"
                ? "Quiz"
                : "";
        if (parentLabel && CONTEXTUAL_SUFFIX[segment]) {
          label = `${CONTEXTUAL_SUFFIX[segment]}${parentLabel ? ` ${parentLabel}` : ""}`;
        }
      }

      items.push({ label, href });
    }

    return items.map((item, index) => ({
      ...item,
      isLast: index === items.length - 1,
    }));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <SidebarTrigger className="-ml-2 shrink-0" />

        <div className="hidden min-w-0 lg:block">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item) => (
                <Fragment key={item.href}>
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={item.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!item.isLast && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
        <AdminThemeToggle />
        {userId && <NotificationBell userId={userId} />}
        <UserDropdown />
      </div>
    </header>
  );
}

