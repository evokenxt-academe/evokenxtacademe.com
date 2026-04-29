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
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

const userRoleStyles: Record<AdminUser["role"], string> = {
  student: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  instructor:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  admin:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const enrollmentStyles: Record<AdminEnrollment["status"], string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  expired: "border-muted-foreground/20 bg-muted text-muted-foreground",
  refunded:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function EnrollmentsPage() {
  const enrollmentsQuery = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: adminApi.getEnrollments,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  const coursesQuery = useQuery({
    queryKey: ["admin-courses"],
    queryFn: adminApi.getCourses,
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data?.enrollments],
  );
  const users = React.useMemo(
    () => usersQuery.data?.users ?? [],
    [usersQuery.data?.users],
  );
  const courses = React.useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data?.courses],
  );

  const [search, setSearch] = React.useState("");
  const [userSearch, setUserSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminEnrollment["status"]
  >("all");
  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokeEnrollment, setRevokeEnrollment] =
    React.useState<AdminEnrollment | null>(null);

  // Form state for manual enrollment
  const [enrollForm, setEnrollForm] = React.useState({
    learnerId: "",
    courseId: "",
    expiresAt: "",
  });

  const selectedLearner = React.useMemo(
    () => users.find((user) => user.id === enrollForm.learnerId) ?? null,
    [enrollForm.learnerId, users],
  );

  const filteredUsers = React.useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      return (
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [userSearch, users]);

  const queryClient = useQueryClient();

  const createEnrollmentMutation = useMutation({
    mutationFn: () => {
      if (!selectedLearner) {
        throw new Error("Select an existing learner before enrolling");
      }

      return adminApi.createEnrollment({
        email: selectedLearner.email,
        courseId: enrollForm.courseId,
        expiresAt: enrollForm.expiresAt || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("User enrolled successfully");
      setEnrollOpen(false);
      setEnrollForm({ learnerId: "", courseId: "", expiresAt: "" });
      setUserSearch("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enroll user");
    },
  });

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

  // Debugging
  React.useEffect(() => {
    console.log("Admin Enrollments Data:", {
      enrollments: enrollments.length,
      users: users.length,
      courses: courses.length,
    });
  }, [enrollments, users, courses]);

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

  const columns = React.useMemo<ColumnDef<AdminEnrollment>[]>(
    () => [
      { accessorKey: "user", header: "User" },
      { accessorKey: "course", header: "Course" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
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
        <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <IconUserPlus />
              Manually enroll user
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manual enrollment</DialogTitle>
              <DialogDescription>
                Select an existing learner from Supabase, then assign a course
                and optional expiry date.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="enroll-learner">Select learner</FieldLabel>
                <FieldContent>
                  <Input
                    id="enroll-learner"
                    placeholder="Search users by name, email, or role..."
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    className="h-10 rounded-xl"
                  />
                  <div className="mt-3 rounded-2xl border border-border/70 bg-background/60">
                    <div className="border-b border-border/70 px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Users from Supabase
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2">
                      {usersQuery.isLoading ? (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground italic">
                          Fetching users from Supabase...
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user: AdminUser) => {
                          const isSelected = user.id === enrollForm.learnerId;

                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setEnrollForm((prev) => ({
                                  ...prev,
                                  learnerId: user.id,
                                }));
                                setUserSearch(user.name);
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                isSelected
                                  ? "bg-primary/10 ring-1 ring-primary/20"
                                  : ""
                              }`}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {getInitials(user.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="truncate font-medium text-sm">
                                    {user.name}
                                  </span>
                                  <Badge
                                    className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${userRoleStyles[user.role]}`}
                                  >
                                    {user.role}
                                  </Badge>
                                </div>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No users found. Try a different name, email, or role.
                        </div>
                      )}
                    </div>
                  </div>
                </FieldContent>
                <FieldDescription>
                  Pulls users from the Supabase user list endpoint and reuses
                  the selected learner&apos;s email for enrollment.
                </FieldDescription>
                {selectedLearner ? (
                  <div className="mt-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(selectedLearner.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">
                            {selectedLearner.name}
                          </p>
                          <Badge
                            className={`rounded-full border px-2.5 py-1 capitalize ${userRoleStyles[selectedLearner.role]}`}
                          >
                            {selectedLearner.role}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {selectedLearner.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEnrollForm((prev) => ({ ...prev, learnerId: "" }));
                          setUserSearch("");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-xl bg-background/80 px-3 py-2">
                        <span className="block uppercase tracking-wide text-[10px] text-muted-foreground">
                          Account created
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDate(selectedLearner.createdAt)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-background/80 px-3 py-2">
                        <span className="block uppercase tracking-wide text-[10px] text-muted-foreground">
                          Enrollment target
                        </span>
                        <span className="font-medium text-foreground">
                          Ready for course assignment
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="enroll-course">Course</FieldLabel>
                <FieldContent>
                  <Select
                    value={enrollForm.courseId}
                    onValueChange={(value) =>
                      setEnrollForm((prev) => ({ ...prev, courseId: value }))
                    }
                  >
                    <SelectTrigger id="enroll-course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesQuery.isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading courses...
                        </SelectItem>
                      ) : (
                        courses.map((course: AdminCourse) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FieldContent>
                {!courses.length && !coursesQuery.isLoading ? (
                  <FieldDescription className="text-destructive">
                    No courses are available. Check the admin course list API.
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="enroll-expiry">Expiry date</FieldLabel>
                <FieldContent>
                  <Input
                    id="enroll-expiry"
                    type="date"
                    value={enrollForm.expiresAt}
                    onChange={(e) =>
                      setEnrollForm((prev) => ({
                        ...prev,
                        expiresAt: e.target.value,
                      }))
                    }
                  />
                </FieldContent>
                <FieldDescription>
                  Use a date aligned with the enrollment policy.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  createEnrollmentMutation.isPending ||
                  !selectedLearner ||
                  !enrollForm.courseId
                }
                onClick={() => createEnrollmentMutation.mutate()}
              >
                {createEnrollmentMutation.isPending
                  ? "Enrolling..."
                  : "Enroll user"}
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
