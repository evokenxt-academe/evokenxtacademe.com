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
                      updateRoleMutation.mutate({ userId: user.id, role: "student" })
                    }
                  >
                    <IconUser />
                    Make student
                  </DropdownMenuItem>
                ) : null}
                {user.role !== "instructor" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      updateRoleMutation.mutate({ userId: user.id, role: "instructor" })
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

      <Dialog
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User profile</DialogTitle>
            <DialogDescription>
              Read-only details for the selected account.
            </DialogDescription>
          </DialogHeader>
          {viewUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(viewUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{viewUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {viewUser.email}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge
                    className={`rounded-full border px-2.5 py-1 capitalize ${roleStyles[viewUser.role]}`}
                  >
                    {viewUser.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(viewUser.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

export default function Page() {
  return <UsersPageContent />;
}
