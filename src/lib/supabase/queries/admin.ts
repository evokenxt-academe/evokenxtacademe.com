/**
 * Admin Dashboard Queries
 * =====================
 * Real-time queries for admin dashboard KPIs, charts, and tables
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────
// KPI QUERIES
// ──────────────────────────────────────────

/**
 * Get total student count
 */
export async function getTotalStudents(
    supabase: SupabaseClient<any>
): Promise<number> {
    const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
    return count ?? 0;
}

/**
 * Get active enrollments count
 */
export async function getActiveEnrollments(
    supabase: SupabaseClient<any>
): Promise<number> {
    const { count } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
    return count ?? 0;
}

/**
 * Get revenue for current month
 */
export async function getMonthRevenue(
    supabase: SupabaseClient<any>
): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

    const { data } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("status", "successful")
        .gte("created_at", startOfMonth);
    const payments = (data as any[]) ?? [];
    return payments.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
}

/**
 * Get certificates issued (all time)
 */
export async function getCertificatesIssued(
    supabase: SupabaseClient<any>
): Promise<number> {
    const { count } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("status", "issued");
    return count ?? 0;
}

/**
 * Get previous month revenue for trend calculation
 */
export async function getPreviousMonthRevenue(
    supabase: SupabaseClient<any>
): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];

    const { data } = await supabase
        .from("payments")
        .select("amount_paid")
        .eq("status", "successful")
        .gte("created_at", startOfPreviousMonth)
        .lt("created_at", startOfMonth);
    const payments = (data as any[]) ?? [];
    return payments.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
}

// ──────────────────────────────────────────
// CHART DATA QUERIES
// ──────────────────────────────────────────

/**
 * Get daily revenue for last 30 days
 */
export async function getDailyRevenueData(
    supabase: SupabaseClient<any>
): Promise<Array<{ date: string; revenue: number }>> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const { data } = await supabase
        .from("payments")
        .select("created_at, amount_paid")
        .eq("status", "successful")
        .gte("created_at", last30Days.toISOString());
    const grouped = new Map<string, number>();
    const payments = (data as any[]) ?? [];

    payments.forEach((payment) => {
        const date = new Date(payment.created_at).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
        });
        grouped.set(date, (grouped.get(date) ?? 0) + (payment.amount_paid ?? 0));
    });

    return Array.from(grouped.entries()).map(([date, revenue]) => ({
        date,
        revenue,
    }));
}

/**
 * Get enrollments by program (ACCA, CFA, CMA)
 */
export async function getEnrollmentsByProgram(
    supabase: SupabaseClient<any>
): Promise<
    Array<{
        program: string;
        enrollments: number;
    }>
> {
    const { data } = await supabase.rpc(
        "get_enrollments_by_program"
    );
    const rows = (data ?? []) as any[];
    return rows.map((row: { program_body: string; count: number }) => ({
        program: row.program_body,
        enrollments: row.count,
    }));
}

/**
 * Get students by country
 */
export async function getStudentsByCountry(
    supabase: SupabaseClient<any>
): Promise<
    Array<{
        country: string;
        students: number;
    }>
> {
    const { data } = await supabase
        .from("student_profiles")
        .select("country")
        .not("country", "is", null);
    const grouped = new Map<string, number>();
    const profiles = (data as any[]) ?? [];

    profiles.forEach((profile) => {
        const country = profile.country ?? "Unknown";
        grouped.set(country, (grouped.get(country) ?? 0) + 1);
    });

    // Sort by student count descending and take top 10
    return Array.from(grouped.entries())
        .map(([country, students]) => ({ country, students }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 10);
}

/**
 * Get quiz pass rate by course (top 10)
 */
export async function getQuizPassRateByCourse(
    supabase: SupabaseClient<any>
): Promise<
    Array<{
        course: string;
        passRate: number;
    }>
> {
    const { data } = await supabase.rpc(
        "get_quiz_pass_rate_by_course",
        { limit_count: 10 } as any
    );
    const rows = (data ?? []) as any[];
    return rows.map((row: { course_title: string; pass_rate: number }) => ({
        course: row.course_title,
        passRate: Math.round(row.pass_rate * 100),
    }));
}

// ──────────────────────────────────────────
// TABLE DATA QUERIES
// ──────────────────────────────────────────

/**
 * Get recent payments (last 10)
 */
export async function getRecentPayments(
    supabase: SupabaseClient<any>
): Promise<
    Array<{
        id: string;
        studentName: string;
        courseTitle: string;
        amount: number;
        gateway: string;
        status: string;
        createdAt: string;
    }>
> {
    const { data } = await supabase
        .from("payments")
        .select(
            `id, amount_paid, gateway, status, created_at,
       user:users(name),
       enrollment:enrollments(
         course:courses(title)
       )`
        )
        .order("created_at", { ascending: false })
        .limit(10);

    return (data ?? []).map((payment: any) => ({
        id: payment.id,
        studentName: payment.user?.name ?? "Unknown",
        courseTitle: payment.enrollment?.course?.title ?? "Unknown",
        amount: payment.amount_paid,
        gateway: payment.gateway,
        status: payment.status,
        createdAt: new Date(payment.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));
}
