"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Video,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type DashboardSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "course" | "quiz" | "live";
};

const typeIcons = {
  course: BookOpen,
  quiz: ClipboardList,
  live: Video,
};

interface DashboardSearchCommandProps {
  items: DashboardSearchItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSearchCommand({
  items,
  open,
  onOpenChange,
}: DashboardSearchCommandProps) {
  const router = useRouter();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const courses = items.filter((i) => i.type === "course");
  const quizzes = items.filter((i) => i.type === "quiz");
  const live = items.filter((i) => i.type === "live");

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search courses, quizzes, and live sessions"
    >
      <CommandInput placeholder="Search courses, quizzes, topics..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {courses.length > 0 ? (
          <CommandGroup heading="Courses">
            {courses.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => navigate(item.href)}
                >
                  <Icon />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
        {quizzes.length > 0 ? (
          <CommandGroup heading="Quizzes">
            {quizzes.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => navigate(item.href)}
                >
                  <Icon />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
        {live.length > 0 ? (
          <CommandGroup heading="Live sessions">
            {live.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => navigate(item.href)}
                >
                  <Icon />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export function DashboardSearchTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label="Open search"
    >
      <Search className="size-4 text-muted-foreground" />
      <span className="hidden text-sm text-muted-foreground lg:inline">
        Search courses, quizzes...
      </span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
