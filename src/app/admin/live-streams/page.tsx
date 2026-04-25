"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconBroadcast,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconSearch,
  IconTrash,
  IconCopy,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

/* ─── types ─── */

type DBStream = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  ytVideoId: string | null;
  status: AdminLiveStream["status"];
  scheduledAt: string;
};

type Course = { id: string; name: string };

/* ─── style map ─── */

const streamStyles: Record<AdminLiveStream["status"], string> = {
  scheduled:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  live: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 animate-pulse",
  ended: "border-muted-foreground/20 bg-muted text-muted-foreground",
  cancelled:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const statusIcons: Record<AdminLiveStream["status"], string> = {
  scheduled: "📅",
  live: "🔴",
  ended: "✅",
  cancelled: "❌",
};

/* ─── helpers ─── */

async function manageStream(payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/live-streams/manage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch("/api/admin/courses", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data.courses ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
  }));
}

/* ─── component ─── */

export default function LiveStreamsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-streams"],
    queryFn: adminApi.getLiveStreams,
  });

  const { data: coursesData } = useQuery({
    queryKey: ["admin-courses-dropdown"],
    queryFn: fetchCourses,
  });

  const liveStreams = data?.liveStreams ?? [];
  const courses = coursesData ?? [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminLiveStream["status"]
  >("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Create form state
  const [newTitle, setNewTitle] = React.useState("");
  const [newCourseId, setNewCourseId] = React.useState("");
  const [newYtVideoId, setNewYtVideoId] = React.useState("");
  const [newScheduledAt, setNewScheduledAt] = React.useState("");

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
  }, [search, statusFilter, liveStreams]);

  const createMutation = useMutation({
    mutationFn: () =>
      manageStream({
        action: "create",
        title: newTitle,
        courseId: newCourseId,
        ytVideoId: newYtVideoId || null,
        scheduledAt: newScheduledAt
          ? new Date(newScheduledAt).toISOString()
          : new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Live stream scheduled successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewCourseId("");
      setNewYtVideoId("");
      setNewScheduledAt("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: {
      streamId: string | number;
      status: string;
      ytVideoId?: string;
    }) =>
      manageStream({
        action: "update-status",
        streamId: vars.streamId,
        status: vars.status,
        ytVideoId: vars.ytVideoId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (streamId: string | number) =>
      manageStream({ action: "delete", streamId }),
    onSuccess: () => {
      toast.success("Stream deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleStatusChange = (
    stream: AdminLiveStream,
    newStatus: AdminLiveStream["status"]
  ) => {
    if (
      newStatus === "live" &&
      !(stream as unknown as DBStream).ytVideoId
    ) {
      const videoId = prompt(
        "Enter YouTube Live Video ID (from OBS/YouTube Studio):"
      );
      if (!videoId) return;
      statusMutation.mutate({
        streamId: stream.id,
        status: "live",
        ytVideoId: videoId,
      });
      toast.success(`${stream.title} is now LIVE!`);
    } else {
      statusMutation.mutate({ streamId: stream.id, status: newStatus });
      toast.success(
        `${stream.title} → ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`
      );
    }
  };

  const columns = React.useMemo<ColumnDef<AdminLiveStream>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusIcons[row.original.status]}</span>
            <div>
              <p className="font-semibold">{row.original.title}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.course}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full border px-2.5 py-1 capitalize ${streamStyles[row.original.status]}`}
          >
            {row.original.status === "live" && (
              <span className="mr-1 inline-block size-2 rounded-full bg-red-500" />
            )}
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
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
              >
                <IconBroadcast className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Stream actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {row.original.status === "scheduled" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original, "live")}
                >
                  <IconPlayerPlay className="mr-2 size-4" />
                  Go Live
                </DropdownMenuItem>
              )}

              {row.original.status === "live" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original, "ended")}
                >
                  <IconPlayerStop className="mr-2 size-4" />
                  End Stream
                </DropdownMenuItem>
              )}

              {(row.original.status === "scheduled" ||
                row.original.status === "live") && (
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusChange(row.original, "cancelled")
                  }
                >
                  <IconX className="mr-2 size-4" />
                  Cancel
                </DropdownMenuItem>
              )}

              {(row.original as unknown as DBStream).ytVideoId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      const vid = (row.original as unknown as DBStream)
                        .ytVideoId;
                      if (vid) {
                        navigator.clipboard.writeText(vid);
                        toast.success("Video ID copied!");
                      }
                    }}
                  >
                    <IconCopy className="mr-2 size-4" />
                    Copy Video ID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const vid = (row.original as unknown as DBStream)
                        .ytVideoId;
                      if (vid) {
                        window.open(
                          `https://www.youtube.com/watch?v=${vid}`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    <IconExternalLink className="mr-2 size-4" />
                    Open on YouTube
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${row.original.title}"? This will also delete all chat messages.`
                    )
                  ) {
                    deleteMutation.mutate(row.original.id);
                  }
                }}
              >
                <IconTrash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <AdminPageShell
      title="Live Streams"
      description="Manage scheduled sessions, broadcast live via OBS, and moderate streams."
      actions={
        <Button
          className="rounded-xl gap-2"
          onClick={() => setIsCreateOpen(true)}
        >
          <IconPlus className="size-4" />
          Schedule Stream
        </Button>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredStreams}
        emptyTitle="No streams found"
        emptyDescription="Schedule your first live stream to get started."
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

      {/* ─── Create Stream Dialog ─── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBroadcast className="size-5 text-primary" />
              Schedule a Live Stream
            </DialogTitle>
            <DialogDescription>
              Create a live stream session. You can add the YouTube video ID now
              or when you go live via OBS.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="stream-title">Stream Title</Label>
              <Input
                id="stream-title"
                placeholder="e.g. Weekly Doubt Clearing Session"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-course">Course</Label>
              <Select value={newCourseId} onValueChange={setNewCourseId}>
                <SelectTrigger id="stream-course" className="rounded-xl">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-yt-id">
                YouTube Live Video ID{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="stream-yt-id"
                placeholder="e.g. dQw4w9WgXcQ"
                value={newYtVideoId}
                onChange={(e) => setNewYtVideoId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                From YouTube Studio → Go Live → Stream → copy the video ID from
                the share URL. You can also set this when going live.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-date">Scheduled Date & Time</Label>
              <Input
                id="stream-date"
                type="datetime-local"
                value={newScheduledAt}
                onChange={(e) => setNewScheduledAt(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || !newTitle || !newCourseId
                }
              >
                {createMutation.isPending ? "Scheduling…" : "Schedule Stream"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
