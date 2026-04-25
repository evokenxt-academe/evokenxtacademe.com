"use client";

import { useMemo } from "react";
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

export function AdminHeader() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: `/${segments.slice(0, index + 1).join("/")}`,
      isLast: index === segments.length - 1,
    }));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <SidebarTrigger className="-ml-2 shrink-0" />

        <div className="hidden min-w-0 lg:block">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <Fragment key={item.href}>
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {index === 0 ? "Dashboard" : item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={item.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {index === 0 ? "Dashboard" : item.label}
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
        <UserDropdown />
      </div>
    </header>
  );
}
