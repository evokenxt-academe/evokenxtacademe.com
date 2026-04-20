"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/features/admin/data/admin-sample-data";
import { formatDate } from "@/features/admin/lib/formatters";

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
  const coursesQuery = useQuery({
    queryKey: ["admin-courses"],
    queryFn: adminApi.getCourses,
  });

  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const courses = coursesQuery.data?.courses ?? [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminEnrollment["status"]
  >("all");
  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokeEnrollment, setRevokeEnrollment] =
    React.useState<AdminEnrollment | null>(null);

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
  }, [search, statusFilter]);

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
            className="rounded-lg"
            onClick={() => setRevokeEnrollment(row.original)}
          >
            <IconShieldLock />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual enrollment</DialogTitle>
              <DialogDescription>
                Add a learner to a course with a chosen expiry date.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="enroll-email">User email</FieldLabel>
                <FieldContent>
                  <Input id="enroll-email" placeholder="student@example.com" />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="enroll-course">Course</FieldLabel>
                <FieldContent>
                  <Select>
                    <SelectTrigger id="enroll-course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course: AdminCourse) => (
                        <SelectItem key={course.id} value={course.name}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="enroll-expiry">Expiry date</FieldLabel>
                <FieldContent>
                  <Input id="enroll-expiry" type="date" />
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
                onClick={() => {
                  toast.success("Enrollment created");
                  setEnrollOpen(false);
                }}
              >
                Enroll user
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
              onClick={() => {
                if (revokeEnrollment) {
                  toast.success(`Access revoked for ${revokeEnrollment.user}`);
                  setRevokeEnrollment(null);
                }
              }}
            >
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
