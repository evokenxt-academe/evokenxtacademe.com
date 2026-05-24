"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconEye,
  IconMail,
  IconSearch,
  IconUser,
  IconUserPlus,
  IconBook,
  IconPlaylistAdd,
  IconCircleCheck,
  IconAward,
  IconClock,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { type AdminUser } from "@/features/admin/data/admin-sample-data";
import { formatDate, getInitials } from "@/features/admin/lib/formatters";

const roleStyles: Record<AdminUser["role"], string> = {
  student: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  instructor:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  admin:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

interface StudentDetails {
  enrollments: Array<{
    id: string;
    status: string;
    enrolled_at: string;
    expires_at: string | null;
    course_id: string;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail_url: string | null;
    } | null;
  }>;
  stats: {
    totalCoursesEnrolled: number;
    activeEnrollments: number;
    lecturesWatchedToday: number;
    lecturesCompletedToday: number;
    totalWatchedTodaySeconds: number;
    totalLecturesWatched: number;
    totalLecturesCompleted: number;
    quizzesAttempted: number;
    quizzesPassed: number;
    certificatesEarned: number;
  };
  recentActivity: {
    quizAttempts: Array<{
      id: string;
      quiz_id: string;
      score: number;
      total_marks: number;
      passed: boolean;
      status: string;
      submitted_at: string;
      quiz: { id: string; title: string; passing_marks: number } | null;
    }>;
    certificates: Array<{
      id: string;
      issued_at: string;
      course: { name: string } | null;
    }>;
  };
  error?: string;
}

function formatTimeCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function StudentDetailsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: studentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-details", user.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/student-details?studentId=${user.id}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      return (await response.json()) as StudentDetails;
    },
    enabled: open && user.role === "student",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>
            Comprehensive details for the selected student account.
          </DialogDescription>
        </DialogHeader>

        {user.role === "student" ? (
          isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                Loading student details...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                Failed to load student details
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : studentData ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {formatDate(user.createdAt)}
                  </p>
                </div>
                <Badge className="capitalize bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20">
                  {user.role}
                </Badge>
              </div>

              {/* Tabs with Different Views */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Today's Learning */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconClock className="size-4 text-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Today's Learning
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatTimeCompact(
                          studentData.stats.totalWatchedTodaySeconds,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {studentData.stats.lecturesWatchedToday} lecture
                        {studentData.stats.lecturesWatchedToday !== 1
                          ? "s"
                          : ""}{" "}
                        watched
                      </p>
                    </div>

                    {/* Total Courses */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBook className="size-4 text-blue-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Enrolled Courses
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {studentData.stats.totalCoursesEnrolled}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {studentData.stats.activeEnrollments} active
                      </p>
                    </div>

                    {/* Total Lectures */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconPlaylistAdd className="size-4 text-purple-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Lectures Completed
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {studentData.stats.totalLecturesCompleted}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {studentData.stats.totalLecturesWatched} total
                      </p>
                    </div>

                    {/* Quizzes */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconCircleCheck className="size-4 text-green-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Quizzes Passed
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {studentData.stats.quizzesPassed}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {studentData.stats.quizzesAttempted} attempts
                      </p>
                    </div>

                    {/* Certificates */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconAward className="size-4 text-yellow-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Certificates
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {studentData.stats.certificatesEarned}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        certificates earned
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Progress
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {studentData.stats.totalLecturesWatched > 0
                          ? Math.round(
                              (studentData.stats.totalLecturesCompleted /
                                studentData.stats.totalLecturesWatched) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        overall completion
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-3">
                  {studentData.enrollments.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No courses enrolled yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {studentData.enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="rounded-lg border border-border/70 p-3 flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {enrollment.course?.title || "Unknown Course"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Status:{" "}
                              <Badge
                                variant="outline"
                                className={
                                  enrollment.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                                }
                              >
                                {enrollment.status}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enrolled: {formatDate(enrollment.enrolled_at)}
                            </p>
                            {enrollment.expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {formatDate(enrollment.expires_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Recent Quiz Attempts
                    </h4>
                    {studentData.recentActivity.quizAttempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No quiz attempts yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {studentData.recentActivity.quizAttempts.map(
                          (attempt) => (
                            <div
                              key={attempt.id}
                              className="rounded-lg border border-border/70 p-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {attempt.quiz?.title || "Quiz"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(attempt.submitted_at)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {attempt.score} / {attempt.total_marks}
                                  </p>
                                  <Badge
                                    className={
                                      attempt.passed
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                        : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
                                    }
                                  >
                                    {attempt.passed ? "Passed" : "Failed"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">
                      Certificates Earned
                    </h4>
                    {studentData.recentActivity.certificates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No certificates earned yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {studentData.recentActivity.certificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="rounded-lg border border-border/70 p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {cert.course?.name || "Course"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Issued: {formatDate(cert.issued_at)}
                                </p>
                              </div>
                              <IconAward className="size-4 text-yellow-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Failed to load student details
              </p>
            </div>
          )
        ) : (
          /* Non-Student User Details */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge
                  className={`rounded-full border px-2.5 py-1 capitalize ${roleStyles[user.role]}`}
                >
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UsersPageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  const users = data?.users ?? [];
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AdminUser["role"]>(
    "all",
  );
  const [viewUser, setViewUser] = React.useState<AdminUser | null>(null);

  const queryClient = useQueryClient();
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User role updated to ${variables.role}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const filteredUsers = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [users, search, roleFilter]);

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium leading-none">{user.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;

          return (
            <Badge
              className={`rounded-full border px-2.5 py-1 capitalize ${roleStyles[role]}`}
            >
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;

          if (user.role === "admin") {
            return <span className="text-sm text-muted-foreground">None</span>;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                >
                  <IconUser />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setViewUser(user)}>
                  <IconEye />
                  View details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.role !== "student" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      updateRoleMutation.mutate({
                        userId: user.id,
                        role: "student",
                      })
                    }
                  >
                    <IconUser />
                    Make student
                  </DropdownMenuItem>
                ) : null}
                {user.role !== "instructor" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      updateRoleMutation.mutate({
                        userId: user.id,
                        role: "instructor",
                      })
                    }
                  >
                    <IconUserPlus />
                    Make instructor
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateRoleMutation],
  );

  return (
    <AdminPageShell
      title="Users"
      description="Search, filter, and manage every account in the LMS from one place."
      actions={
        <Button asChild className="rounded-xl">
          <Link href="/admin/instructor">
            <IconArrowRight />
            View instructors
          </Link>
        </Button>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredUsers}
        emptyTitle="No users found"
        emptyDescription="Try a broader search or clear the role filter to see more accounts."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-60 flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select
                value={roleFilter}
                onValueChange={(value) =>
                  setRoleFilter(value as typeof roleFilter)
                }
              >
                <SelectTrigger className="h-10 rounded-xl md:w-44">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                toast.info(
                  "Invite flow can hook into your auth invite endpoint",
                )
              }
            >
              <IconMail />
              Invite user
            </Button>
          </>
        }
      />

      {viewUser && (
        <StudentDetailsDialog
          user={viewUser}
          open={!!viewUser}
          onOpenChange={(open) => !open && setViewUser(null)}
        />
      )}
    </AdminPageShell>
  );
}

export default function Page() {
  return <UsersPageContent />;
}
