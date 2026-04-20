"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconBroadcast,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconSearch,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { type AdminLiveStream } from "@/features/admin/data/admin-sample-data";
import { formatDateTime } from "@/features/admin/lib/formatters";

const streamStyles: Record<AdminLiveStream["status"], string> = {
  scheduled:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  live: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ended: "border-muted-foreground/20 bg-muted text-muted-foreground",
  cancelled:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function LiveStreamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-streams"],
    queryFn: adminApi.getLiveStreams,
  });

  const liveStreams = data?.liveStreams ?? [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminLiveStream["status"]
  >("all");

  const filteredStreams = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return liveStreams.filter((stream) => {
      const matchesQuery =
        !query ||
        stream.title.toLowerCase().includes(query) ||
        stream.course.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || stream.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [search, statusFilter]);

  const columns = React.useMemo<ColumnDef<AdminLiveStream>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      { accessorKey: "course", header: "Course" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full border px-2.5 py-1 capitalize ${streamStyles[row.original.status]}`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "scheduledAt",
        header: "Scheduled",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.scheduledAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                <IconBroadcast />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Stream actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.success(`${row.original.title} started`)}
              >
                <IconPlayerPlay />
                Start
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success(`${row.original.title} ended`)}
              >
                <IconPlayerPause />
                End
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success(`${row.original.title} cancelled`)}
              >
                <IconPlayerStop />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Live Streams"
      description="Manage scheduled sessions, live sessions, and completed broadcasts."
      actions={
        <Button
          className="rounded-xl"
          onClick={() => toast.info("Schedule stream flow goes here")}
        >
          Schedule stream
        </Button>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredStreams}
        emptyTitle="No streams found"
        emptyDescription="Try another search term or switch the stream status filter."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-60 flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search streams"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger className="h-10 rounded-xl md:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filteredStreams.length} streams
            </Badge>
          </>
        }
      />
    </AdminPageShell>
  );
}
