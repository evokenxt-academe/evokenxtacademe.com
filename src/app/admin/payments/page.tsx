"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDataTable } from "@/features/admin/components/admin-data-table";
import { createClient } from "@/lib/supabase/client";
import {
  getAllPayments,
  getPaymentSummary,
  type PaymentRow,
} from "@/lib/supabase/queries/payments";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";

interface SummaryCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PaymentsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-payments", statusFilter],
    queryFn: () =>
      getAllPayments(supabase, {
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ["admin-payment-summary"],
    queryFn: () => getPaymentSummary(supabase),
  });

  // ──────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ──────────────────────────────────────────

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
          queryClient.invalidateQueries({
            queryKey: ["admin-payment-summary"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // ──────────────────────────────────────────
  // TABLE COLUMNS
  // ──────────────────────────────────────────

  const columns: ColumnDef<PaymentRow>[] = [
    {
      accessorKey: "id",
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="text-xs font-mono">
          {(row.getValue<string>("id") ?? "").slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: "student_name",
      header: "Student",
      cell: ({ row }) => (
        <div className="font-medium text-sm">
          {row.getValue("student_name")}
        </div>
      ),
    },
    {
      accessorKey: "course_title",
      header: "Course",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("course_title")}
        </span>
      ),
    },
    {
      accessorKey: "amount_paid",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.getValue<number>("amount_paid") ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "gateway",
      header: "Gateway",
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-sm text-xs">
          {row.getValue("gateway")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "successful"
                ? "default"
                : status === "pending"
                  ? "secondary"
                  : "destructive"
            }
            className="rounded-sm text-xs"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("created_at")}
        </span>
      ),
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
            <DropdownMenuItem>View Invoice</DropdownMenuItem>
            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
            {row.original.status === "pending" && (
              <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
            )}
            {row.original.status === "successful" && (
              <DropdownMenuItem className="text-red-600">
                Refund
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // ──────────────────────────────────────────
  // SUMMARY CARDS
  // ──────────────────────────────────────────

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Paid",
      value: summary ? formatCurrency(summary.total_paid) : "₹0",
      icon: <CheckCircle className="size-5 text-green-600" />,
    },
    {
      label: "Pending",
      value: summary ? formatCurrency(summary.total_pending) : "₹0",
      icon: <AlertCircle className="size-5 text-yellow-600" />,
    },
    {
      label: "Failed/Refunded",
      value: summary ? formatCurrency(summary.total_failed) : "₹0",
      icon: <CreditCard className="size-5 text-red-600" />,
    },
  ];

  return (
    <AdminPageShell
      title="Payments"
      description="Manage student payments and transactions"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {card.icon}
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2">
        {["all", "successful", "pending", "failed"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="rounded-lg"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={payments}
        isLoading={paymentsLoading}
        searchPlaceholder="Search payments..."
      />
    </AdminPageShell>
  );
}
