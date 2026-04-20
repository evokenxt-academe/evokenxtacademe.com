"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { IconSearch, IconSchool } from "@tabler/icons-react";

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

export default function InstructorPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  const instructors = (data?.users ?? []).filter(
    (user) => user.role === "instructor",
  );
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AdminUser["role"]>(
    "instructor",
  );

  const filteredInstructors = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return instructors.filter((instructor) => {
      const matchesQuery =
        !query ||
        instructor.name.toLowerCase().includes(query) ||
        instructor.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" || instructor.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [instructors, search, roleFilter]);

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Instructor",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(row.original.name)}
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-sm text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full border px-2.5 py-1 capitalize ${roleStyles[row.original.role]}`}
          >
            {row.original.role}
          </Badge>
        ),
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
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Instructors"
      description="Monitor instructor accounts, availability, and admin permissions."
      actions={
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() =>
            toast.info("Instructor onboarding can connect to your invite flow")
          }
        >
          <IconSchool />
          Invite instructor
        </Button>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredInstructors}
        emptyTitle="No instructors found"
        emptyDescription="No matching instructors are available for the current search."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search instructors"
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
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filteredInstructors.length} instructors
            </Badge>
          </>
        }
      />
    </AdminPageShell>
  );
}
