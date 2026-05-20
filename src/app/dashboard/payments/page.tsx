import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { IconReceipt, IconCalendar } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentRow {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  gateway_payment_id: string | null;
  created_at: string;
  courses: {
    name: string;
    slug: string;
  } | null;
}

function formatCurrency(amount: number, currency: string): string {
  const currencyMap: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    GBP: "en-GB",
    EUR: "de-DE",
  };
  const locale = currencyMap[currency.toUpperCase()] ?? "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase() || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, user_id, course_id, amount, currency, status, gateway, gateway_payment_id, created_at, courses(name:title, slug)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[payments] fetch: ${error.message}`);
  }

  const payments = (Array.isArray(data) ? data : []) as unknown as PaymentRow[];

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Payment History
          </h1>
          <p className="text-sm text-muted-foreground">
            All transactions linked to your account.
          </p>
        </div>
        <div className="flex gap-3">
          <Card className="w-fit">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-semibold">{payments.length}</div>
              <div className="text-xs text-muted-foreground">Transactions</div>
            </CardContent>
          </Card>
          <Card className="w-fit">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-semibold">
                {formatCurrency(totalPaid, "INR")}
              </div>
              <div className="text-xs text-muted-foreground">Total paid</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Log</CardTitle>
            <CardDescription>
              Full payment history from Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.courses?.name ?? "Course"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(
                        Number(payment.amount),
                        payment.currency || "INR",
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(payment.status)}
                        className="capitalize"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {payment.gateway}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          dateStyle: "medium",
                        },
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-lg border-dashed">
          <CardContent className="space-y-4 py-12 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
              <IconReceipt className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-semibold">No payments yet</h4>
              <p className="text-sm text-muted-foreground">
                Transaction history will appear here when you enroll in a paid
                course.
              </p>
            </div>
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
