"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import {
  IconDotsVertical,
  IconEdit,
  IconList,
  IconCurrencyDollar,
  IconCopy,
  IconUpload,
  IconEyeOff,
  IconArchive,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconVideo,
} from "@tabler/icons-react";
import type { CourseListItem } from "@/lib/supabase/queries/courses-admin";

interface CourseMobileCardProps {
  course: CourseListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: (id: string) => void;
  onContent: (id: string) => void;
  onLiveStreams: (id: string) => void;
  onPricing: (course: CourseListItem) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, status: "draft" | "published" | "archived") => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
}

export function CourseMobileCard({
  course,
  selected,
  onSelect,
  onEdit,
  onContent,
  onLiveStreams,
  onPricing,
  onDuplicate,
  onStatusChange,
  onDelete,
  onToggleFeatured,
}: CourseMobileCardProps) {
  const subject = course.subject;
  const programLabel = subject?.program_level?.program
    ? `${subject.program_level.program.body} · ${subject.program_level.label}`
    : null;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelect(!!value)}
          aria-label={`Select ${course.title}`}
          className="mt-1"
        />
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="size-12 object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {course.title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="truncate font-medium leading-tight hover:underline"
              >
                {course.title}
              </Link>
              <p className="truncate font-mono text-xs text-muted-foreground">
                /{course.slug}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(course.id)}>
                    <IconEdit data-icon="inline-start" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onContent(course.id)}>
                    <IconList data-icon="inline-start" />
                    Manage Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLiveStreams(course.id)}>
                    <IconVideo data-icon="inline-start" />
                    Live Streams
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPricing(course)}>
                    <IconCurrencyDollar data-icon="inline-start" />
                    View Pricing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(course.id)}>
                    <IconCopy data-icon="inline-start" />
                    Duplicate
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {course.status !== "published" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(course.id, "published")}
                    >
                      <IconUpload data-icon="inline-start" />
                      Publish
                    </DropdownMenuItem>
                  )}
                  {course.status === "published" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(course.id, "draft")}
                    >
                      <IconEyeOff data-icon="inline-start" />
                      Unpublish
                    </DropdownMenuItem>
                  )}
                  {course.status !== "archived" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(course.id, "archived")}
                    >
                      <IconArchive data-icon="inline-start" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(course.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {programLabel && (
            <p className="mt-1 text-xs text-muted-foreground">{programLabel}</p>
          )}
          {subject?.name && (
            <p className="text-xs text-muted-foreground">{subject.name}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={course.status} />
            <span className="text-xs text-muted-foreground">
              {course.total_students || 0} students
            </span>
            {course.avg_rating != null && (
              <span className="flex items-center gap-0.5 text-xs">
                <IconStarFilled className="size-3 text-amber-500" />
                {Number(course.avg_rating).toFixed(1)}
              </span>
            )}
            <button
              type="button"
              onClick={() => onToggleFeatured(course.id, !course.is_featured)}
              className="rounded p-0.5 hover:bg-muted"
            >
              {course.is_featured ? (
                <IconStarFilled className="size-4 text-amber-500" />
              ) : (
                <IconStar className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {course.instructor && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={course.instructor.avatar || undefined} />
                <AvatarFallback className="text-[10px]">
                  {course.instructor.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-muted-foreground">
                {course.instructor.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
