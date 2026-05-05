"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDataTable } from "@/features/admin/components/admin-data-table";
import { createClient } from "@/lib/supabase/client";
import { getAllStreams, type StreamRow } from "@/lib/supabase/queries/streams";

export default function StreamsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["admin-streams"],
    queryFn: () => getAllStreams(supabase),
  });

  // ──────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ──────────────────────────────────────────

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-streams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // ──────────────────────────────────────────
  // TABLE COLUMNS
  // ──────────────────────────────────────────

  const columns: ColumnDef<StreamRow>[] = [
    {
      accessorKey: "title",
      header: "Stream Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status === "live" && (
            <div className="flex items-center gap-1">
              <Zap className="size-4 text-red-600 animate-pulse" />
            </div>
          )}
          <div className="font-medium">{row.getValue("title")}</div>
        </div>
      ),
    },
    {
      accessorKey: "course_title",
      header: "Course",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("course_title")}
        </span>
      ),
    },
    {
      accessorKey: "instructor_name",
      header: "Instructor",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("instructor_name")}</span>
      ),
    },
    {
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("scheduled_at")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "live"
                ? "destructive"
                : status === "scheduled"
                  ? "secondary"
                  : "default"
            }
            className="rounded-sm text-xs"
          >
            {status === "live" ? "🔴 LIVE" : status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "viewers_count",
      header: "Viewers",
      cell: ({ row }) => {
        const count = row.getValue("viewers_count") as number;
        return (
          <span className="text-sm font-medium">
            {count > 0 ? `${count} watching` : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                // TODO: View live stream
              }}
            >
              View Stream
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Edit stream
              }}
            >
              Edit
            </DropdownMenuItem>
            {row.original.status === "scheduled" && (
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Go live
                }}
              >
                Go Live
              </DropdownMenuItem>
            )}
            {row.original.status === "live" && (
              <DropdownMenuItem
                onClick={() => {
                  // TODO: End stream
                }}
              >
                End Stream
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Live Streams"
      description="Manage and monitor live streams for courses"
      actions={
        <Button className="gap-2">
          <Plus className="size-4" />
          Schedule Stream
        </Button>
      }
    >
      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={streams}
        isLoading={isLoading}
        searchPlaceholder="Search streams..."
      />
    </AdminPageShell>
  );
}
