"use client";

import { ColumnDef } from "@tanstack/react-table";
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
} from "@tabler/icons-react";
import type { CourseListItem } from "@/lib/supabase/queries/courses-admin";

interface ColumnActions {
  onEdit: (id: string) => void;
  onContent: (id: string) => void;
  onPricing: (course: CourseListItem) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, status: "draft" | "published" | "archived") => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
}

export function getCourseColumns(actions: ColumnActions): ColumnDef<CourseListItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "thumbnail_url",
      header: "",
      cell: ({ row }) => {
        const url = row.original.thumbnail_url;
        const title = row.original.title;
        return (
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
            {url ? (
              <img
                src={url}
                alt={title}
                className="size-10 rounded-md object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        );
      },
      size: 56,
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium leading-tight">{row.original.title}</span>
          <span className="font-mono text-xs text-muted-foreground">
            /{row.original.slug}
          </span>
        </div>
      ),
      size: 240,
    },
    {
      id: "program",
      header: "Program",
      cell: ({ row }) => {
        const subject = row.original.subject;
        if (!subject?.program_level?.program) return <span className="text-muted-foreground">—</span>;
        const { program } = subject.program_level;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium">{program.body}</span>
            <span className="text-muted-foreground">
              {subject.program_level.label} · {subject.name}
            </span>
          </div>
        );
      },
      size: 200,
    },
    {
      id: "instructor",
      header: "Instructor",
      cell: ({ row }) => {
        const instructor = row.original.instructor;
        if (!instructor) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={instructor.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {instructor.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{instructor.name}</span>
          </div>
        );
      },
      size: 160,
    },
    {
      accessorKey: "total_students",
      header: () => <span className="text-right">Students</span>,
      cell: ({ row }) => (
        <span className="text-right tabular-nums">
          {row.original.total_students || 0}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: "avg_rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.original.avg_rating;
        if (!rating) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1">
            <IconStarFilled className="size-3.5 text-amber-500" />
            <span className="text-sm tabular-nums">{Number(rating).toFixed(1)}</span>
          </div>
        );
      },
      size: 80,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "is_featured",
      header: "Featured",
      cell: ({ row }) => {
        const isFeatured = row.original.is_featured;
        return (
          <button
            onClick={() => actions.onToggleFeatured(row.original.id, !isFeatured)}
            className="rounded p-1 hover:bg-muted"
          >
            {isFeatured ? (
              <IconStarFilled className="size-4 text-amber-500" />
            ) : (
              <IconStar className="size-4 text-muted-foreground" />
            )}
          </button>
        );
      },
      size: 72,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <IconDotsVertical className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => actions.onEdit(course.id)}>
                  <IconEdit data-icon="inline-start" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onContent(course.id)}>
                  <IconList data-icon="inline-start" />
                  Manage Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onPricing(course)}>
                  <IconCurrencyDollar data-icon="inline-start" />
                  View Pricing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onDuplicate(course.id)}>
                  <IconCopy data-icon="inline-start" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {course.status !== "published" && (
                  <DropdownMenuItem onClick={() => actions.onStatusChange(course.id, "published")}>
                    <IconUpload data-icon="inline-start" />
                    Publish
                  </DropdownMenuItem>
                )}
                {course.status === "published" && (
                  <DropdownMenuItem onClick={() => actions.onStatusChange(course.id, "draft")}>
                    <IconEyeOff data-icon="inline-start" />
                    Unpublish
                  </DropdownMenuItem>
                )}
                {course.status !== "archived" && (
                  <DropdownMenuItem onClick={() => actions.onStatusChange(course.id, "archived")}>
                    <IconArchive data-icon="inline-start" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => actions.onDelete(course.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 48,
    },
  ];
}
