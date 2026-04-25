"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconCash,
  IconDownload,
  IconSearch,
  IconReceipt,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { type AdminPayment } from "@/features/admin/data/admin-sample-data";
import {
  currencyFormatter,
  formatDateTime,
} from "@/features/admin/lib/formatters";

const paymentStyles: Record<AdminPayment["status"], string> = {
  pending:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  refunded: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: adminApi.getPayments,
  });

  const payments = data?.payments ?? [];
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | AdminPayment["status"]
  >("all");

  const filteredPayments = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesQuery =
        !query ||
        payment.user.toLowerCase().includes(query) ||
        payment.course.toLowerCase().includes(query) ||
        payment.gateway.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const totalRevenue = React.useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0),
    [filteredPayments],
  );

  const columns = React.useMemo<ColumnDef<AdminPayment>[]>(
    () => [
      { accessorKey: "user", header: "User" },
      { accessorKey: "course", header: "Course" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium">
            {currencyFormatter.format(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={`rounded-full border px-2.5 py-1 capitalize ${paymentStyles[status]}`}
            >
              {status}
            </Badge>
          );
        },
      },
      { accessorKey: "gateway", header: "Gateway" },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => toast.info("Open payment receipt")}
          >
            <IconReceipt />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Payments"
      description="Track payment status, gateway resolution, and live revenue flow."
      actions={
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => toast.success("Export queued")}
        >
          <IconDownload />
          Export
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Total revenue</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {currencyFormatter.format(totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Paid transactions</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {
                filteredPayments.filter((payment) => payment.status === "paid")
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardDescription>Pending review</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {
                filteredPayments.filter(
                  (payment) => payment.status === "pending",
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AdminResourceTable
        columns={columns}
        data={filteredPayments}
        emptyTitle="No payments found"
        emptyDescription="Try another status filter or search for a specific user or course."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full flex-1 md:max-w-md">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="Search payments"
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
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                toast.info(
                  "Reconciliation report coming from the finance pipeline",
                )
              }
            >
              <IconCash />
              Reconcile
            </Button>
          </>
        }
      />
    </AdminPageShell>
  );
}
