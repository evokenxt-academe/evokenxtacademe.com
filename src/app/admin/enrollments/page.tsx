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
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Label } from "@/components/ui/label";
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
import {
  type AdminCourse,
  type AdminEnrollment,
  type AdminUser,
} from "@/features/admin/data/admin-sample-data";
import { formatDate, getInitials } from "@/features/admin/lib/formatters";

/* ------------------------------------------------------------------ */
/*  Style maps (shadcn tokens only)                                   */
/* ------------------------------------------------------------------ */

const enrollmentStyles: Record<AdminEnrollment["status"], string> = {
  active: "border-transparent bg-primary/10 text-primary",
  expired: "border-transparent bg-muted text-muted-foreground",
  refunded: "border-transparent bg-destructive/10 text-destructive",
};

/* ------------------------------------------------------------------ */
/*  Manual Enrollment Sheet                                           */
/* ------------------------------------------------------------------ */

function ManualEnrollSheet({
  users,
  courses,
  enrollments,
  usersLoading,
  coursesLoading,
  open,
  onOpenChange,
}: {
  users: AdminUser[];
  courses: AdminCourse[];
  enrollments: AdminEnrollment[];
  usersLoading: boolean;
  coursesLoading: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = React.useState("");
  const [form, setForm] = React.useState({
    learnerId: "",
    courseId: "",
    expiresAt: "",
  });

  const selectedLearner = React.useMemo(
    () => users.find((u) => u.id === form.learnerId) ?? null,
    [form.learnerId, users],
  );
  const selectedCourse = React.useMemo(
    () => courses.find((c) => c.id === form.courseId) ?? null,
    [form.courseId, courses],
  );
  const existingEnrollment = React.useMemo(() => {
    if (!selectedLearner || !form.courseId) return null;
    return (
      enrollments.find(
        (e) =>
          e.userId === selectedLearner.id && e.courseId === form.courseId,
      ) ?? null
    );
  }, [selectedLearner, form.courseId, enrollments]);
  const isAlreadyActive = existingEnrollment?.status === "active";

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [userSearch, users]);

  const resetForm = React.useCallback(() => {
    setForm({ learnerId: "", courseId: "", expiresAt: "" });
    setUserSearch("");
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedLearner) throw new Error("Select a learner first");
      if (!form.courseId) throw new Error("Select a course first");
      return adminApi.createEnrollment({
        email: selectedLearner.email,
        courseId: form.courseId,
        expiresAt: form.expiresAt || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success(
        (data as { message?: string }).message ?? "User enrolled successfully",
      );
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to enroll user"),
  });

  const canSubmit =
    !!selectedLearner &&
    !!form.courseId &&
    !isAlreadyActive &&
    !mutation.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <SheetTrigger asChild>
        <Button className="rounded-xl">
          <IconUserPlus className="size-4" />
          Manually enroll user
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:h-screen data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl"
      >
        {/* ── Header ── */}
        <SheetHeader className="gap-1 border-b px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-semibold">
                Manual enrollment
              </SheetTitle>
              <SheetDescription>
                Select a user, choose a course, and grant access.
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              <IconX className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {/* Step 1 — User selection */}
            <section className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                1 · Learner
              </Label>

              {selectedLearner ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {getInitials(selectedLearner.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {selectedLearner.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedLearner.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {selectedLearner.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setForm((p) => ({ ...p, learnerId: "" }));
                      setUserSearch("");
                    }}
                  >
                    <IconX className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="enroll-learner-search"
                      placeholder="Search by name or email…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        Users
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {filteredUsers.length}
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {usersLoading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Loading…
                        </p>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const selected = user.id === form.learnerId;
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setForm((p) => ({
                                  ...p,
                                  learnerId: user.id,
                                }));
                                setUserSearch("");
                              }}
                              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                                selected ? "bg-accent" : ""
                              }`}
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                {getInitials(user.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {user.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                              {selected && (
                                <IconCheck className="size-4 shrink-0 text-foreground" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          No users found.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>

            <Separator />

            {/* Step 2 — Course */}
            <section className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                2 · Course
              </Label>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enroll-course">Course</Label>
                  <Select
                    value={form.courseId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, courseId: v }))
                    }
                  >
                    <SelectTrigger id="enroll-course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading courses…
                        </SelectItem>
                      ) : (
                        courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!courses.length && !coursesLoading && (
                    <p className="text-xs text-destructive">
                      No courses available.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enroll-expiry">
                    Expiry date{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="enroll-expiry"
                    type="date"
                    value={form.expiresAt}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expiresAt: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited access.
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {isAlreadyActive && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <strong>{selectedLearner?.name}</strong> is already enrolled
                    in <strong>{selectedCourse?.name}</strong>.
                  </span>
                </div>
              )}
              {existingEnrollment && !isAlreadyActive && (
                <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                  <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Previous enrollment (
                    <strong>{existingEnrollment.status}</strong>). This will
                    reactivate access.
                  </span>
                </div>
              )}
            </section>

            {/* Summary */}
            {selectedLearner && form.courseId && !isAlreadyActive && (
              <>
                <Separator />
                <section className="space-y-3">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    3 · Summary
                  </Label>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Learner</dt>
                        <dd className="font-medium">{selectedLearner.name}</dd>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Course</dt>
                        <dd className="font-medium">{selectedCourse?.name}</dd>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Expires</dt>
                        <dd className="font-medium">
                          {form.expiresAt
                            ? formatDate(form.expiresAt)
                            : "Never"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <SheetFooter className="flex-row gap-3 border-t px-6 py-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Enrolling…" : "Enroll user"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const enrollmentsQuery = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: adminApi.getEnrollments,
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data?.enrollments],
  );
  const users = React.useMemo(
    () => enrollmentsQuery.data?.users ?? [],
    [enrollmentsQuery.data?.users],
  );
  const courses = React.useMemo(
    () => enrollmentsQuery.data?.courses ?? [],
    [enrollmentsQuery.data?.courses],
  );

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminEnrollment["status"]
  >("all");
  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokeEnrollment, setRevokeEnrollment] =
    React.useState<AdminEnrollment | null>(null);

  const revokeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      adminApi.revokeEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Enrollment revoked");
      setRevokeEnrollment(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to revoke enrollment"),
  });

  const filteredEnrollments = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const matchQ =
        !q ||
        e.user.toLowerCase().includes(q) ||
        e.course.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || e.status === statusFilter;
      return matchQ && matchS;
    });
  }, [enrollments, search, statusFilter]);

  const columns = React.useMemo<ColumnDef<AdminEnrollment>[]>(
    () => [
      { accessorKey: "user", header: "User" },
      { accessorKey: "course", header: "Course" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`capitalize ${enrollmentStyles[row.original.status]}`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "enrolledAt",
        header: "Enrolled",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.enrolledAt)}
          </span>
        ),
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
        cell: ({ row }) =>
          row.original.status === "active" ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setRevokeEnrollment(row.original)}
            >
              <IconShieldLock className="size-4" />
              Revoke
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Enrollments"
      description="Grant access, track expiry windows, and revoke access in seconds."
      actions={
        <ManualEnrollSheet
          users={users as AdminUser[]}
          courses={courses as AdminCourse[]}
          enrollments={enrollments}
          usersLoading={enrollmentsQuery.isLoading}
          coursesLoading={enrollmentsQuery.isLoading}
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
        />
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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as typeof statusFilter)
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
              This will permanently remove{" "}
              <strong>{revokeEnrollment?.user}</strong> from{" "}
              <strong>{revokeEnrollment?.course}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeEnrollmentMutation.isPending}
              onClick={() => {
                if (revokeEnrollment)
                  revokeEnrollmentMutation.mutate(revokeEnrollment.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeEnrollmentMutation.isPending
                ? "Revoking…"
                : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
