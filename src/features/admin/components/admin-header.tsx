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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminThemeToggle } from "@/components/admin-theme-toggle";
import {
  IconAlertCircle,
  IconBell,
  IconCircleDashed,
  IconCommand,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";

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
        <div className="relative hidden w-full max-w-xl min-w-0 lg:block">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-xl border-border/80 bg-background/80 pl-9 pr-20 shadow-sm"
            placeholder="Search users, courses, payments..."
          />
          <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground md:flex">
            <IconCommand className="size-3.5" />K
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl"
            >
              <IconBell />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconSparkles />
              New course published successfully.
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconAlertCircle />3 payments are still pending review.
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconCircleDashed />
              12 enrollments expire this week.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AdminThemeToggle />
        <UserDropdown />
      </div>
    </header>
  );
}
