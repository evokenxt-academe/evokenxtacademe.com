/**
 * Payments Query Layer
 * ====================
 * Queries for payments, invoices, and revenue analytics
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface PaymentRow {
    id: string;
    student_name: string;
    course_title: string;
    amount_paid: number;
    gateway: string;
    status: string;
    instalment_no: number | null;
    created_at: string;
}

/**
 * Get all payments with filters
 */
export async function getAllPayments(
    supabase: SupabaseClient<any>,
    filters?: {
        status?: string;
        gateway?: string;
        course_id?: string;
        date_from?: string;
        date_to?: string;
    }
): Promise<PaymentRow[]> {
    let query = supabase
        .from("payments")
        .select(
            `id, amount_paid, gateway, status, created_at,
       user:users(name),
       enrollment:enrollments(
         course:courses(title)
       ),
       instalment_schedule(instalment_no)`
        )
        .order("created_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.gateway) {
        query = query.eq("gateway", filters.gateway);
    }

    if (filters?.date_from) {
        query = query.gte("created_at", filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte("created_at", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[payments] getAllPayments error:", error.message);
        return [];
    }

    return (data ?? []).map((payment: any) => ({
        id: payment.id,
        student_name: payment.user?.name || "Unknown",
        course_title: payment.enrollment?.course?.title || "Unknown",
        amount_paid: payment.amount_paid,
        gateway: payment.gateway,
        status: payment.status,
        instalment_no: (payment.instalment_schedule as any[])?.[0]?.instalment_no,
        created_at: new Date(payment.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));
}

/**
 * Get payment summary stats
 */
export async function getPaymentSummary(
    supabase: SupabaseClient<any>
): Promise<{
    total_paid: number;
    total_pending: number;
    total_failed: number;
}> {
    const { data: paidData } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("status", "successful");

    const { data: pendingData } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("status", "pending");

    const { data: failedData } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("status", "failed");

    const paid = (paidData ?? []) as any[];
    const pending = (pendingData ?? []) as any[];
    const failed = (failedData ?? []) as any[];

    const totalPaid = paid.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const totalPending = pending.reduce(
        (sum, p) => sum + (p.amount_paid || 0),
        0
    );
    const totalFailed = failed.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

    return {
        total_paid: totalPaid,
        total_pending: totalPending,
        total_failed: totalFailed,
    };
}

/**
 * Get payment status breakdown
 */
export async function getPaymentStatusBreakdown(
    supabase: SupabaseClient<any>
): Promise<
    Array<{
        status: string;
        count: number;
        amount: number;
    }>
> {
    const statuses = [
        "successful",
        "pending",
        "failed",
        "refunded",
        "partially_paid",
    ];

    const results: any[] = [];

    for (const status of statuses) {
        const { data, error } = await supabase
            .from("payments")
            .select("amount_paid", { count: "exact" })
            .eq("status", status);

        if (!error) {
            const rows = (data as any[]) ?? [];
            const amount = rows.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
            results.push({
                status,
                count: rows.length || 0,
                amount,
            });
        }
    }

    return results;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
    supabase: SupabaseClient<any>,
    paymentId: string,
    status: string
): Promise<boolean> {
    const { error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", paymentId);

    if (error) {
        console.error("[payments] updatePaymentStatus error:", error.message);
        return false;
    }

    return true;
}
