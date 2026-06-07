"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconBook,
  IconCalendar,
  IconCalendarEvent,
  IconSearch,
  IconUserPlus,
  IconUsers,
  IconShieldLock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { formatDate, getInitials } from "@/features/admin/lib/formatters";
import { createClient } from "@/utils/supabase/client";

// ── Types ───────────────────────────────────────────────

type Role = "student" | "instructor" | "admin";
type EnrollmentStatus = "active" | "expired" | "refunded";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface EnrollmentInput {
  userIds: string[];
  courseIds: string[];
  expiresAt: string | null;
}

interface EnrollmentAssignmentResult {
  created: number;
  reactivated: number;
  skippedActive: number;
}

function formatEnrollmentError(message: string): string {
  if (
    message.includes("enrollments_user_id_course_id_key") ||
    message.includes("duplicate key")
  ) {
    return "One or more users are already enrolled in the selected courses.";
  }
  return message || "Failed to create enrollments";
}

function buildAssignmentToast(result: EnrollmentAssignmentResult): {
  type: "success" | "warning";
  title: string;
  description?: string;
} {
  const assigned = result.created + result.reactivated;

  if (assigned === 0 && result.skippedActive > 0) {
    return {
      type: "warning",
      title: "Already enrolled",
      description:
        result.skippedActive === 1
          ? "This user already has active access to the selected course."
          : "All selected users already have active access to the chosen courses.",
    };
  }

  if (result.skippedActive > 0) {
    const assignedLabel = `${assigned} enrollment${assigned === 1 ? "" : "s"} assigned`;
    const skippedLabel = `${result.skippedActive} already had active access and ${result.skippedActive === 1 ? "was" : "were"} skipped`;
    return {
      type: "success",
      title: assignedLabel,
      description: skippedLabel,
    };
  }

  if (result.reactivated > 0 && result.created > 0) {
    return {
      type: "success",
      title: `${assigned} enrollment${assigned === 1 ? "" : "s"} assigned`,
      description: `${result.created} new, ${result.reactivated} reactivated from expired or refunded access.`,
    };
  }

  if (result.reactivated > 0) {
    return {
      type: "success",
      title: `${result.reactivated} enrollment${result.reactivated === 1 ? "" : "s"} reactivated`,
      description: "Access was restored for previously expired or refunded enrollments.",
    };
  }

  return {
    type: "success",
    title: `${result.created} enrollment${result.created === 1 ? "" : "s"} created`,
  };
}

// ── UI Styles ───────────────────────────────────────────

const userRoleStyles: Record<Role, string> = {
  student: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  instructor:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  admin:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const enrollmentStyles: Record<EnrollmentStatus, string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  expired: "border-muted-foreground/20 bg-muted text-muted-foreground",
  refunded:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

// ── Supabase Queries ────────────────────────────────────

function useUsers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["supabase-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .order("name");

      if (error) throw new Error(error.message);
      return data as User[];
    },
  });
}

function useCourses() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["supabase-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug")
        .order("title");

      if (error) throw new Error(error.message);
      return data as Course[];
    },
  });
}

function useExistingActiveEnrollments(
  userIds: string[],
  courseIds: string[],
  enabled: boolean,
) {
  const supabase = createClient();
  return useQuery({
    queryKey: [
      "enrollment-pairs-active",
      [...userIds].sort(),
      [...courseIds].sort(),
    ],
    enabled: enabled && userIds.length > 0 && courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("user_id, course_id")
        .in("user_id", userIds)
        .in("course_id", courseIds)
        .eq("status", "active");

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

function useCreateEnrollments() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnrollmentInput): Promise<EnrollmentAssignmentResult> => {
      if (!input.userIds.length || !input.courseIds.length) {
        throw new Error("Select at least one user and one course.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("enrollments")
        .select("user_id, course_id, status")
        .in("user_id", input.userIds)
        .in("course_id", input.courseIds);

      if (existingError) {
        throw new Error(formatEnrollmentError(existingError.message));
      }

      const existingByPair = new Map(
        (existing ?? []).map((row: any) => [
          `${row.user_id}:${row.course_id}`,
          row.status as EnrollmentStatus,
        ]),
      );

      let created = 0;
      let reactivated = 0;
      let skippedActive = 0;
      const payloads: Array<{
        user_id: string;
        course_id: string;
        status: EnrollmentStatus;
        enrolled_at: string;
        expires_at: string | null;
      }> = [];

      for (const userId of input.userIds) {
        for (const courseId of input.courseIds) {
          const existingStatus = existingByPair.get(`${userId}:${courseId}`);

          if (existingStatus === "active") {
            skippedActive++;
            continue;
          }

          if (existingStatus === "expired" || existingStatus === "refunded") {
            reactivated++;
          } else {
            created++;
          }

          payloads.push({
            user_id: userId,
            course_id: courseId,
            status: "active",
            enrolled_at: new Date().toISOString(),
            expires_at: input.expiresAt,
          });
        }
      }

      if (payloads.length === 0) {
        return { created: 0, reactivated: 0, skippedActive };
      }

      const { error } = await supabase.from("enrollments").upsert(payloads as any, {
        onConflict: "user_id,course_id",
      });

      if (error) {
        throw new Error(formatEnrollmentError(error.message));
      }

      return { created, reactivated, skippedActive };
    },
    onSuccess: (result) => {
      const message = buildAssignmentToast(result);
      if (message.type === "warning") {
        toast.warning(message.title, { description: message.description });
      } else {
        toast.success(message.title, { description: message.description });
      }

      if (result.created + result.reactivated > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
        queryClient.invalidateQueries({
          queryKey: ["enrollment-pairs-active"],
        });
      }
    },
    onError: (error: Error) => {
      toast.error(formatEnrollmentError(error.message));
    },
  });
}

// ── Component ───────────────────────────────────────────

export default function EnrollmentsPage() {
  // Keep the list viewing on the old admin API for now as requested
  const enrollmentsQuery = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: adminApi.getEnrollments,
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data?.enrollments],
  );

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | EnrollmentStatus
  >("all");

  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokeEnrollment, setRevokeEnrollment] = React.useState<any | null>(
    null,
  );

  // New hooks
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const createEnrollment = useCreateEnrollments();

  // Multi-select Form State
  const [userSearch, setUserSearch] = React.useState("");
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [expiryType, setExpiryType] = React.useState<"never" | "custom">(
    "never",
  );
  const [customExpiry, setCustomExpiry] = React.useState("");

  const selectedUserIdList = React.useMemo(
    () => Array.from(selectedUserIds),
    [selectedUserIds],
  );
  const selectedCourseIdList = React.useMemo(
    () => Array.from(selectedCourseIds),
    [selectedCourseIds],
  );

  const existingActiveQuery = useExistingActiveEnrollments(
    selectedUserIdList,
    selectedCourseIdList,
    enrollOpen,
  );

  const totalPairCount = selectedUserIds.size * selectedCourseIds.size;
  const alreadyActiveCount = existingActiveQuery.data?.length ?? 0;
  const newAssignmentCount = Math.max(0, totalPairCount - alreadyActiveCount);
  const allAlreadyEnrolled =
    totalPairCount > 0 && alreadyActiveCount >= totalPairCount;

  const resetForm = () => {
    setUserSearch("");
    setSelectedUserIds(new Set());
    setSelectedCourseIds(new Set());
    setExpiryType("never");
    setCustomExpiry("");
  };

  const handleOpenChange = (open: boolean) => {
    setEnrollOpen(open);
    if (!open) resetForm();
  };

  const handleEnroll = () => {
    createEnrollment.mutate(
      {
        userIds: selectedUserIdList,
        courseIds: selectedCourseIdList,
        expiresAt: expiryType === "never" ? null : customExpiry || null,
      },
      {
        onSuccess: (result) => {
          if (result.created + result.reactivated > 0) {
            setEnrollOpen(false);
            resetForm();
          }
        },
      },
    );
  };

  const queryClient = useQueryClient();
  const revokeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      adminApi.revokeEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Enrollment revoked");
      setRevokeEnrollment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke enrollment");
    },
  });

  const filteredEnrollments = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      const matchesQuery =
        !query ||
        enrollment.user.toLowerCase().includes(query) ||
        enrollment.course.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || enrollment.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [enrollments, search, statusFilter]);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "user", header: "User" },
      { accessorKey: "course", header: "Course" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status as EnrollmentStatus;
          return (
            <Badge
              className={`rounded-full border px-2.5 py-1 capitalize ${enrollmentStyles[status]}`}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setRevokeEnrollment(row.original)}
          >
            <IconShieldLock className="h-4 w-4" />
            Revoke
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Enrollments"
      description="Grant access, track expiry windows, and revoke access in seconds."
      actions={
        <Dialog open={enrollOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <IconUserPlus />
              Assign access
            </Button>
          </DialogTrigger>
          <DialogContent className="flex h-[min(90vh,820px)] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-5 pr-14">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Bulk Course Assignment
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Select users and courses, then set an optional expiry. Each
                user–course pair creates one enrollment.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {/* 1. USERS */}
                <section className="flex min-h-0 flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <IconUsers className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-none">
                          Select users
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Search by name or email, then pick one or more.
                        </p>
                      </div>
                    </div>
                    {selectedUserIds.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {selectedUserIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                    <Command className="flex h-full flex-col bg-transparent" shouldFilter={false}>
                      <CommandInput
                        placeholder="Search users by name or email..."
                        className="h-11 border-0 border-b border-border/60 bg-background/80 px-4"
                        value={userSearch}
                        onValueChange={setUserSearch}
                      />
                      <CommandList className="max-h-none flex-1 overflow-y-auto">
                        {!userSearch.trim() ? (
                          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                            <IconSearch className="size-5 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              Type a name or email to search users
                            </p>
                          </div>
                        ) : loadingUsers ? (
                          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Loading users...
                          </div>
                        ) : (
                          <CommandGroup className="p-2">
                            {users
                              .filter(
                                (u) =>
                                  u.name
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()) ||
                                  u.email
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()),
                              )
                              .map((user) => {
                                const isSelected = selectedUserIds.has(user.id);
                                return (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.name} ${user.email}`}
                                    onSelect={() => {
                                      const next = new Set(selectedUserIds);
                                      if (isSelected) next.delete(user.id);
                                      else next.add(user.id);
                                      setSelectedUserIds(next);
                                    }}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent"
                                  >
                                    <div
                                      className={`flex size-5 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                                    >
                                      {isSelected && (
                                        <IconCheck className="size-3.5" />
                                      )}
                                    </div>
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                      {getInitials(user.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium leading-tight">
                                        {user.name}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            {users.filter(
                              (u) =>
                                u.name
                                  .toLowerCase()
                                  .includes(userSearch.toLowerCase()) ||
                                u.email
                                  .toLowerCase()
                                  .includes(userSearch.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No users found matching &ldquo;{userSearch}&rdquo;
                              </div>
                            )}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </div>

                  {selectedUserIds.size > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Selected users
                      </p>
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                        {Array.from(selectedUserIds).map((id) => {
                          const u = users.find((x) => x.id === id);
                          if (!u) return null;
                          return (
                            <Badge
                              key={u.id}
                              variant="secondary"
                              className="gap-1.5 rounded-full py-1 pl-2.5 pr-1.5"
                            >
                              <span className="max-w-[140px] truncate">
                                {u.name}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${u.name}`}
                                className="rounded-full p-0.5 hover:bg-muted"
                                onClick={() => {
                                  const next = new Set(selectedUserIds);
                                  next.delete(u.id);
                                  setSelectedUserIds(next);
                                }}
                              >
                                <IconX className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. COURSES */}
                <section className="flex min-h-0 flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <IconBook className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-none">
                          Select courses
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Choose every course to grant access to.
                        </p>
                      </div>
                    </div>
                    {selectedCourseIds.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {selectedCourseIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                    <ScrollArea className="h-[320px] lg:h-full lg:min-h-[320px]">
                      <div className="space-y-1 p-2">
                        {loadingCourses ? (
                          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                            Loading courses...
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                            No courses found.
                          </div>
                        ) : (
                          courses.map((course) => {
                            const isSelected = selectedCourseIds.has(course.id);
                            return (
                              <label
                                key={course.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border/50 hover:bg-accent/60 ${isSelected ? "border-primary/20 bg-accent/50" : ""}`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="mt-0.5"
                                  onCheckedChange={(checked) => {
                                    const next = new Set(selectedCourseIds);
                                    if (checked) next.add(course.id);
                                    else next.delete(course.id);
                                    setSelectedCourseIds(next);
                                  }}
                                />
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <span className="block text-sm font-medium leading-snug">
                                    {course.title}
                                  </span>
                                  <span className="block truncate font-mono text-xs text-muted-foreground">
                                    {course.slug}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </section>
              </div>

              <Separator className="my-8" />

              {/* 3. EXPIRY */}
              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <IconCalendarEvent className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-none">
                      Access expiry
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Control how long enrolled users can access the courses.
                    </p>
                  </div>
                </div>

                <RadioGroup
                  value={expiryType}
                  onValueChange={(val: "never" | "custom") => setExpiryType(val)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="never"
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${expiryType === "never" ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background"}`}
                  >
                    <RadioGroupItem value="never" id="never" className="mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-sm font-medium">
                        Never expire
                      </span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        Lifetime access to all assigned courses
                      </span>
                    </div>
                  </label>

                  <label
                    htmlFor="custom"
                    className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start ${expiryType === "custom" ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background"}`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="custom" id="custom" className="mt-0.5" />
                      <div className="space-y-1">
                        <span className="block text-sm font-medium">
                          Set expiry date
                        </span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">
                          Access ends on the chosen date and time
                        </span>
                      </div>
                    </div>
                    <Input
                      type="datetime-local"
                      value={customExpiry}
                      onChange={(e) => setCustomExpiry(e.target.value)}
                      disabled={expiryType !== "custom"}
                      className="h-10 w-full shrink-0 sm:ml-auto sm:max-w-[220px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </RadioGroup>
              </section>
            </div>

            <DialogFooter className="-mx-0 -mb-0 shrink-0 flex-col gap-4 rounded-none border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 text-left">
                {totalPairCount > 0 ? (
                  allAlreadyEnrolled ? (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      All selected users already have active access to these
                      courses.
                    </p>
                  ) : alreadyActiveCount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {newAssignmentCount}
                      </span>{" "}
                      new enrollment
                      {newAssignmentCount === 1 ? "" : "s"} will be assigned
                      {" · "}
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {alreadyActiveCount} already enrolled
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {totalPairCount}
                      </span>{" "}
                      enrollment
                      {totalPairCount === 1 ? "" : "s"} will be assigned
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select at least one user and one course to continue
                  </p>
                )}
                {allAlreadyEnrolled && (
                  <p className="text-xs text-muted-foreground">
                    Change your selection or revoke existing access before
                    assigning again.
                  </p>
                )}
              </div>
              <div className="flex w-full shrink-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-lg"
                  disabled={
                    createEnrollment.isPending ||
                    selectedUserIds.size === 0 ||
                    selectedCourseIds.size === 0 ||
                    allAlreadyEnrolled ||
                    (expiryType === "custom" && !customExpiry)
                  }
                  onClick={handleEnroll}
                >
                  {createEnrollment.isPending
                    ? "Assigning access..."
                    : allAlreadyEnrolled
                      ? "Already enrolled"
                      : newAssignmentCount > 0
                        ? `Assign ${newAssignmentCount} enrollment${newAssignmentCount === 1 ? "" : "s"}`
                        : `Assign ${selectedCourseIds.size} course${selectedCourseIds.size === 1 ? "" : "s"} to ${selectedUserIds.size} user${selectedUserIds.size === 1 ? "" : "s"}`}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredEnrollments}
        emptyTitle="No enrollments found"
        emptyDescription="Change the filter or search term to find the access record you're after."
        isLoading={enrollmentsQuery.isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search enrollments"
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                toast.info(
                  "Bulk expiry extension can hook into your billing workflow",
                )
              }
            >
              <IconCalendar />
              Extend access
            </Button>
          </>
        }
      />

      <AlertDialog
        open={!!revokeEnrollment}
        onOpenChange={(open) => !open && setRevokeEnrollment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {revokeEnrollment?.user} from{" "}
              {revokeEnrollment?.course}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeEnrollmentMutation.isPending}
              onClick={() => {
                if (revokeEnrollment) {
                  revokeEnrollmentMutation.mutate(revokeEnrollment.id);
                }
              }}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {revokeEnrollmentMutation.isPending
                ? "Revoking..."
                : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
