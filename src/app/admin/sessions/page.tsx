"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconSearch,
  IconRefresh,
  IconPlayerStop,
  IconUsers,
  IconCircleFilled,
  IconDeviceDesktop,
  IconClock,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface UserSession {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  hasSession: boolean;
  sessionLastSeenAt: string | null;
  status: "active" | "idle" | "offline";
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.slice(0, 2).toUpperCase() || "??";
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "text-emerald-500 animate-pulse",
  },
  idle: {
    label: "Idle",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dotClass: "text-amber-500",
  },
  offline: {
    label: "Offline",
    color: "text-muted-foreground",
    bgColor: "bg-muted text-muted-foreground border-border",
    dotClass: "text-muted-foreground/40",
  },
} as const;

const ROLE_STYLES: Record<string, string> = {
  student: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  instructor:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  admin: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

// ────────────────────────────────────────────────────────────
// Data Fetching
// ────────────────────────────────────────────────────────────

async function fetchSessions(): Promise<UserSession[]> {
  const res = await fetch("/api/admin/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions;
}

async function terminateSession(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/sessions/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to terminate session");
  }
}

async function bulkTerminateSessions(
  payload: { userIds?: string[]; scope?: "all_students" | "selected" }
): Promise<{ terminated: number }> {
  const res = await fetch("/api/admin/sessions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to terminate sessions");
  }
  return res.json();
}

// ────────────────────────────────────────────────────────────
// Page Component
// ────────────────────────────────────────────────────────────

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    type: "single" | "bulk" | "all_students";
    userId?: string;
    userName?: string;
  }>({ open: false, type: "single" });

  const {
    data: sessions = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: fetchSessions,
    refetchInterval: 30_000,
  });

  const terminateMutation = useMutation({
    mutationFn: terminateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      toast.success("Session terminated successfully");
      setConfirmDialog({ open: false, type: "single" });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const bulkTerminateMutation = useMutation({
    mutationFn: bulkTerminateSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      toast.success(`Terminated ${data.terminated} session(s)`);
      setConfirmDialog({ open: false, type: "bulk" });
      setSelectedUsers(new Set());
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ── Filtered data ──
  const filtered = React.useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || s.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "has_session" && s.hasSession) ||
        s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [sessions, search, roleFilter, statusFilter]);

  // ── Stats ──
  const stats = React.useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((s) => s.status === "active").length;
    const idle = sessions.filter((s) => s.status === "idle").length;
    const withSession = sessions.filter((s) => s.hasSession).length;
    return { total, active, idle, withSession };
  }, [sessions]);

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const withSession = filtered.filter((s) => s.hasSession);
    if (selectedUsers.size === withSession.length && withSession.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(withSession.map((s) => s.id)));
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === "single" && confirmDialog.userId) {
      terminateMutation.mutate(confirmDialog.userId);
    } else if (confirmDialog.type === "bulk") {
      bulkTerminateMutation.mutate({
        userIds: Array.from(selectedUsers),
        scope: "selected",
      });
    } else if (confirmDialog.type === "all_students") {
      bulkTerminateMutation.mutate({ scope: "all_students" });
    }
  };

  const isMutating = terminateMutation.isPending || bulkTerminateMutation.isPending;

  return (
    <AdminPageShell
      title="Session Management"
      description="Monitor and control active user sessions across your LMS."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["admin-sessions"] })
            }
            disabled={isFetching}
            className="gap-1.5"
          >
            <IconRefresh
              className={cn("size-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>

          {selectedUsers.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setConfirmDialog({ open: true, type: "bulk" })
              }
              className="gap-1.5"
            >
              <IconPlayerStop className="size-4" />
              Terminate Selected ({selectedUsers.size})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <IconPlayerStop className="size-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({ open: true, type: "all_students" })
                }
                className="text-destructive focus:text-destructive"
              >
                Terminate All Student Sessions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={<IconUsers className="size-4" />}
          loading={isLoading}
        />
        <StatsCard
          title="Active Now"
          value={stats.active}
          icon={<IconCircleFilled className="size-3 text-emerald-500" />}
          loading={isLoading}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Idle"
          value={stats.idle}
          icon={<IconClock className="size-4 text-amber-500" />}
          loading={isLoading}
          valueClass="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Sessions Active"
          value={stats.withSession}
          icon={<IconDeviceDesktop className="size-4" />}
          loading={isLoading}
        />
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="has_session">Has Session</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── Sessions Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">User Sessions</CardTitle>
              <CardDescription>
                {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
                {isFetching && !isLoading ? " · Refreshing…" : ""}
              </CardDescription>
            </div>
            {filtered.some((s) => s.hasSession) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-xs"
                  >
                    {selectedUsers.size > 0 ? "Deselect all" : "Select all with sessions"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle selection for bulk actions</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <SessionTableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <IconShieldCheck className="size-10 opacity-40" />
              <p className="text-sm font-medium">No sessions found</p>
              <p className="text-xs">
                {search || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No users registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 pl-4"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                    <TableHead className="w-24 text-right pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      selected={selectedUsers.has(session.id)}
                      onToggleSelect={() => toggleSelect(session.id)}
                      onTerminate={() =>
                        setConfirmDialog({
                          open: true,
                          type: "single",
                          userId: session.id,
                          userName: session.name || session.email || "this user",
                        })
                      }
                      isMutating={isMutating}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirmation Dialog ── */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, type: "single" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {confirmDialog.type === "single"
                ? "Terminate Session"
                : confirmDialog.type === "bulk"
                  ? `Terminate ${selectedUsers.size} Session(s)`
                  : "Terminate All Student Sessions"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "single" ? (
                <>
                  Are you sure you want to terminate the session for{" "}
                  <span className="font-medium text-foreground">
                    {confirmDialog.userName}
                  </span>
                  ? They will be signed out immediately.
                </>
              ) : confirmDialog.type === "bulk" ? (
                `This will forcefully sign out ${selectedUsers.size} selected user(s). They will need to log in again.`
              ) : (
                "This will forcefully sign out ALL students with active sessions. Admins and instructors will not be affected."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, type: "single" })
              }
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
              disabled={isMutating}
            >
              {isMutating ? "Terminating…" : "Terminate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  icon,
  loading,
  valueClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-10" />
          ) : (
            <p className={cn("text-xl font-semibold tabular-nums", valueClass)}>
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({
  session,
  selected,
  onToggleSelect,
  onTerminate,
  isMutating,
}: {
  session: UserSession;
  selected: boolean;
  onToggleSelect: () => void;
  onTerminate: () => void;
  isMutating: boolean;
}) {
  const statusConf = STATUS_CONFIG[session.status];

  return (
    <TableRow
      className={cn(
        "transition-colors",
        selected && "bg-destructive/5"
      )}
    >
      {/* Checkbox */}
      <TableCell className="pl-4">
        {session.hasSession && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="size-4 rounded border-border accent-destructive cursor-pointer"
            aria-label={`Select ${session.name || session.email}`}
          />
        )}
      </TableCell>

      {/* User Info */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="size-9">
              <AvatarImage
                src={session.avatar ?? undefined}
                alt={session.name ?? "User"}
              />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(session.name, session.email)}
              </AvatarFallback>
            </Avatar>
            {/* Status dot overlay */}
            {session.hasSession && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 block size-3 rounded-full border-2 border-background",
                  session.status === "active"
                    ? "bg-emerald-500"
                    : session.status === "idle"
                      ? "bg-amber-500"
                      : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {session.name || "Unnamed User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.email}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell className="hidden sm:table-cell">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-medium capitalize",
            ROLE_STYLES[session.role] ?? ROLE_STYLES.student
          )}
        >
          {session.role}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          variant="outline"
          className={cn("gap-1.5 text-[10px] font-medium", statusConf.bgColor)}
        >
          <IconCircleFilled className={cn("size-2", statusConf.dotClass)} />
          {statusConf.label}
        </Badge>
      </TableCell>

      {/* Last Seen */}
      <TableCell className="hidden md:table-cell">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground tabular-nums cursor-default">
              {relativeTime(session.sessionLastSeenAt)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {session.sessionLastSeenAt
              ? new Date(session.sessionLastSeenAt).toLocaleString("en-IN")
              : "No session recorded"}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right pr-4">
        {session.hasSession ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTerminate}
                disabled={isMutating}
                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <IconPlayerStop className="size-3.5" />
                <span className="hidden sm:inline">End</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Terminate this user's session</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SessionTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
