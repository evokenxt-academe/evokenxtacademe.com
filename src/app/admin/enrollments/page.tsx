"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconCalendar,
  IconSearch,
  IconUserPlus,
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

function useCreateEnrollments() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnrollmentInput) => {
      if (!input.userIds.length || !input.courseIds.length) {
        throw new Error("Missing users or courses");
      }

      const payloads: any[] = [];
      for (const userId of input.userIds) {
        for (const courseId of input.courseIds) {
          payloads.push({
            user_id: userId,
            course_id: courseId,
            status: "active",
            enrolled_at: new Date().toISOString(),
            expires_at: input.expiresAt,
          });
        }
      }

      const { error } = await supabase
        .from("enrollments")
        .insert(payloads as any);
      if (error) throw new Error(error.message);

      return payloads.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully created ${count} enrollment(s)`);
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create enrollments");
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
        userIds: Array.from(selectedUserIds),
        courseIds: Array.from(selectedCourseIds),
        expiresAt: expiryType === "never" ? null : customExpiry || null,
      },
      {
        onSuccess: () => {
          setEnrollOpen(false);
          resetForm();
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
          <DialogContent className="max-w-3xl gap-6 flex flex-col max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Course Assignment</DialogTitle>
              <DialogDescription>
                Select multiple users and courses to grant access in bulk.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-8 pb-4">
                {/* 1. USERS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">1. Select Users</h3>
                    {selectedUserIds.size > 0 && (
                      <Badge variant="secondary" className="rounded-full">
                        {selectedUserIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                    <Command className="bg-transparent" shouldFilter={false}>
                      <CommandInput
                        placeholder="Search users by name or email..."
                        className="h-11"
                        value={userSearch}
                        onValueChange={setUserSearch}
                      />
                      <CommandList className="max-h-[240px] overflow-y-auto border-t">
                        {!userSearch.trim() ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Type a name or email to search users...
                          </div>
                        ) : loadingUsers ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading users...
                          </div>
                        ) : (
                          <CommandGroup>
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
                                    className="flex items-center gap-3 py-2 cursor-pointer"
                                  >
                                    <div
                                      className={`flex items-center justify-center size-5 rounded border ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
                                    >
                                      {isSelected && (
                                        <IconCheck className="size-3.5" />
                                      )}
                                    </div>
                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary shrink-0">
                                      {getInitials(user.name)}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="text-sm font-medium truncate">
                                        {user.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </span>
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
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No users found matching "{userSearch}"
                              </div>
                            )}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </div>

                  {selectedUserIds.size > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Array.from(selectedUserIds).map((id) => {
                        const u = users.find((x) => x.id === id);
                        if (!u) return null;
                        return (
                          <Badge
                            key={u.id}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {u.name}
                            <div
                              className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
                              onClick={() => {
                                const next = new Set(selectedUserIds);
                                next.delete(u.id);
                                setSelectedUserIds(next);
                              }}
                            >
                              <IconX className="size-3" />
                            </div>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. COURSES */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">2. Select Courses</h3>
                    {selectedCourseIds.size > 0 && (
                      <Badge variant="secondary" className="rounded-full">
                        {selectedCourseIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                    <ScrollArea className="h-[200px]">
                      <div className="p-2 space-y-1">
                        {loadingCourses ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading courses...
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No courses found.
                          </div>
                        ) : (
                          courses.map((course) => {
                            const isSelected = selectedCourseIds.has(course.id);
                            return (
                              <label
                                key={course.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${isSelected ? "bg-accent/50" : ""}`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const next = new Set(selectedCourseIds);
                                    if (checked) next.add(course.id);
                                    else next.delete(course.id);
                                    setSelectedCourseIds(next);
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {course.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono">
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
                </div>

                {/* 3. EXPIRY */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">3. Expiry Date</h3>
                  <RadioGroup
                    value={expiryType}
                    onValueChange={(val: "never" | "custom") =>
                      setExpiryType(val)
                    }
                    className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 bg-background"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value="never" id="never" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Never expire
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Lifetime access to the assigned courses
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value="custom" id="custom" />
                      <div className="flex flex-col w-full max-w-xs">
                        <span className="text-sm font-medium mb-2">
                          Set expiry date
                        </span>
                        <Input
                          type="datetime-local"
                          value={customExpiry}
                          onChange={(e) => setCustomExpiry(e.target.value)}
                          disabled={expiryType !== "custom"}
                          className="h-9"
                        />
                      </div>
                    </label>
                  </RadioGroup>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  createEnrollment.isPending ||
                  selectedUserIds.size === 0 ||
                  selectedCourseIds.size === 0 ||
                  (expiryType === "custom" && !customExpiry)
                }
                onClick={handleEnroll}
              >
                {createEnrollment.isPending
                  ? "Assigning access..."
                  : `Assign ${selectedCourseIds.size} course(s) to ${selectedUserIds.size} user(s)`}
              </Button>
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
