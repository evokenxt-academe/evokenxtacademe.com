"use client";

import * as React from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, FileText, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDataTable } from "@/features/admin/components/admin-data-table";
import { createClient } from "@/lib/supabase/client";
import {
  getAllCertificates,
  revokeCertificate,
  getCertificateStats,
  type CertificateRow,
} from "@/lib/supabase/queries/certificates";
import { toast } from "sonner";

export default function CertificatesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showRevokeAlert, setShowRevokeAlert] = React.useState(false);
  const [selectedCert, setSelectedCert] = React.useState<CertificateRow | null>(
    null,
  );

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => getAllCertificates(supabase),
  });

  const { data: stats } = useQuery({
    queryKey: ["certificate-stats"],
    queryFn: () => getCertificateStats(supabase),
  });

  // ──────────────────────────────────────────
  // MUTATIONS
  // ──────────────────────────────────────────

  const revokeMutation = useMutation({
    mutationFn: (certId: string) => revokeCertificate(supabase, certId),
    onSuccess: () => {
      toast.success("Certificate revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-stats"] });
      setShowRevokeAlert(false);
      setSelectedCert(null);
    },
    onError: () => {
      toast.error("Failed to revoke certificate");
    },
  });

  // ──────────────────────────────────────────
  // REAL-TIME SUBSCRIPTIONS
  // ──────────────────────────────────────────

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-certificates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certificates" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
          queryClient.invalidateQueries({ queryKey: ["certificate-stats"] });
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

  const columns: ColumnDef<CertificateRow>[] = [
    {
      accessorKey: "cert_number",
      header: "Cert Number",
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.getValue("cert_number")}
        </code>
      ),
    },
    {
      accessorKey: "student_name",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">
            {row.getValue("student_name")}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.student_email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "course_title",
      header: "Course",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("course_title")}</span>
      ),
    },
    {
      accessorKey: "program_body",
      header: "Program",
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-sm text-xs">
          {row.getValue("program_body")}
        </Badge>
      ),
    },
    {
      accessorKey: "issued_at",
      header: "Issued",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("issued_at")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "issued" ? "default" : "destructive"}
            className="rounded-sm text-xs"
          >
            {status}
          </Badge>
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
                // TODO: Download certificate
              }}
              className="gap-2"
            >
              <Download className="size-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: View certificate
              }}
            >
              View
            </DropdownMenuItem>
            {row.original.status === "issued" && (
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCert(row.original);
                  setShowRevokeAlert(true);
                }}
                className="text-red-600"
              >
                Revoke
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Certificates"
      description="Issue and manage student certificates"
      actions={
        <Button className="gap-2">
          <Plus className="size-4" />
          Issue Certificate
        </Button>
      }
    >
      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats.total_issued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.issued_this_month}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revoked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats.total_revoked}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={certificates}
        isLoading={isLoading}
        searchPlaceholder="Search certificates..."
      />

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeAlert} onOpenChange={setShowRevokeAlert}>
        <AlertDialogContent>
          <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke this certificate? This action cannot
            be undone.
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <p>
                <strong>Certificate:</strong> {selectedCert?.cert_number}
              </p>
              <p>
                <strong>Student:</strong> {selectedCert?.student_name}
              </p>
            </div>
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCert) {
                  revokeMutation.mutate(selectedCert.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
