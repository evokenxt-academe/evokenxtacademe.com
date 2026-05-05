"use client";

import * as React from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ToggleRight, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDataTable } from "@/features/admin/components/admin-data-table";
import { StudentDetailSheet } from "@/features/admin/components/student-detail-sheet";
import { createClient } from "@/lib/supabase/client";
import {
  getAllStudents,
  toggleStudentStatus,
  type StudentRow,
} from "@/lib/supabase/queries/students";
import { toast } from "sonner";

export default function StudentsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentRow | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students", statusFilter],
    queryFn: () =>
      getAllStudents(supabase, {
        is_active:
          statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  // ──────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ──────────────────────────────────────────

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-students")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-students"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // ──────────────────────────────────────────
  // MUTATIONS
  // ──────────────────────────────────────────

  const toggleStatusMutation = useMutation({
    mutationFn: (params: { studentId: string; newStatus: boolean }) =>
      toggleStudentStatus(supabase, params.studentId, params.newStatus),
    onSuccess: (_, variables) => {
      toast.success(
        `Student ${variables.newStatus ? "activated" : "deactivated"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: () => {
      toast.error("Failed to update student status");
    },
  });

  // ──────────────────────────────────────────
  // TABLE COLUMNS
  // ──────────────────────────────────────────

  const columns: ColumnDef<StudentRow>[] = [
    {
      accessorKey: "avatar",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={student.avatar || ""} />
              <AvatarFallback className="text-xs">
                {student.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{student.name}</div>
              <div className="text-xs text-muted-foreground">
                {student.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "target_exam_body",
      header: "Target",
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-sm">
          {row.getValue("target_exam_body")}
        </Badge>
      ),
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("country")}
        </span>
      ),
    },
    {
      accessorKey: "enrolled_courses",
      header: "Enrolled",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.getValue("enrolled_courses")}
        </span>
      ),
    },
    {
      accessorKey: "joined_at",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("joined_at")}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const student = row.original;
        const isActive = student.is_active;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toggleStatusMutation.mutate({
                studentId: student.id,
                newStatus: !isActive,
              })
            }
            disabled={toggleStatusMutation.isPending}
            className="gap-2"
          >
            {toggleStatusMutation.isPending ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <ToggleRight className="size-4" />
            )}
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="rounded-sm text-xs"
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </Button>
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
                setSelectedStudent(row.original);
                setShowDetail(true);
              }}
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Copy email to clipboard or send message
              }}
            >
              Send Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Students"
      description="Manage student accounts and enrollments"
    >
      {/* Filter Bar */}
      <div className="flex gap-2">
        {["all", "active", "inactive"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status as any)}
            className="rounded-lg"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchPlaceholder="Search students by name or email..."
      />

      {/* Student Detail Sheet */}
      <StudentDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        student={selectedStudent}
      />
    </AdminPageShell>
  );
}
