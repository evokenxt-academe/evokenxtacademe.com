/**
 * Enrollments Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for enrollments, payments, and instalment schedules
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  Enrollment,
  Payment,
  InstalmentSchedule,
  Coupon,
  EnrollmentWithDetails,
  Course,
  CoursePricing,
  PaymentPlan,
  User,
  Subject,
  ProgramLevel,
  Program,
  EnrollStatus,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/enrollments] ${scope}: ${msg}`);
  return msg;
}

// ─── Enrollment Types ──────────────────────────────────────────────

export interface EnrolledCourse {
  id: string;
  status: EnrollStatus;
  enrolled_at: string;
  expires_at: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string | null;
    language: string;
    instructor: Pick<User, "id" | "name" | "avatar">;
    subject: Subject & {
      program_level: ProgramLevel & {
        program: Program;
      };
    };
  };
  pricing: CoursePricing | null;
  plan: PaymentPlan | null;
}

// ─── Enrollment Queries ────────────────────────────────────────────

/**
 * Fetch active enrollments for a user
 */
export async function getUserEnrollments(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: EnrollStatus | "all" = "active"
): Promise<QueryResult<EnrolledCourse[]>> {
  let query = supabase
    .from("enrollments")
    .select(`
      id, status, enrolled_at, expires_at,
      course:courses!course_id(
        id, slug, title, thumbnail_url, language,
        instructor:users!instructor_id(id, name, avatar),
        subject:subjects!subject_id(
          *,
          program_level:program_levels!program_level_id(
            *,
            program:programs!program_id(*)
          )
        )
      ),
      pricing:course_pricing!pricing_id(*),
      plan:payment_plans!plan_id(*)
    `)
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  const errMsg = handleError("getUserEnrollments", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as EnrolledCourse[], error: null };
}

/**
 * Check if a user is enrolled in a course
 */
export async function isUserEnrolled(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<{ enrolled: boolean; enrollment: Enrollment | null }>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  const errMsg = handleError("isUserEnrolled", error);
  if (errMsg) return { data: null, error: errMsg };

  return {
    data: {
      enrolled: !!data,
      enrollment: data as Enrollment | null,
    },
    error: null,
  };
}

/**
 * Get enrollment by ID with full details
 */
export async function getEnrollmentById(
  supabase: SupabaseClient<Database>,
  enrollmentId: string
): Promise<QueryResult<EnrollmentWithDetails>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses!course_id(
        *,
        instructor:users!instructor_id(id, name, avatar),
        subject:subjects!subject_id(
          *,
          program_level:program_levels!program_level_id(
            *,
            program:programs!program_id(*)
          )
        )
      ),
      pricing:course_pricing!pricing_id(*),
      plan:payment_plans!plan_id(*),
      coupon:coupons!coupon_id(*),
      payments:payments!enrollment_id(*),
      instalment_schedule:instalment_schedule!enrollment_id(*)
    `)
    .eq("id", enrollmentId)
    .maybeSingle();

  const errMsg = handleError("getEnrollmentById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as EnrollmentWithDetails, error: null };
}

/**
 * Get enrollment for a user and course
 */
export async function getEnrollment(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<Enrollment>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  const errMsg = handleError("getEnrollment", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as Enrollment | null, error: null };
}

// ─── Payment Queries ───────────────────────────────────────────────

/**
 * Fetch payments for a user
 */
export async function getUserPayments(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 20
): Promise<QueryResult<(Payment & { course: Pick<Course, "id" | "title" | "slug"> })[]>> {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      course:courses!course_id(id, title, slug)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const errMsg = handleError("getUserPayments", error);
  if (errMsg) return { data: null, error: errMsg };

  return {
    data: data as unknown as (Payment & { course: Pick<Course, "id" | "title" | "slug"> })[],
    error: null,
  };
}

/**
 * Fetch payments for an enrollment
 */
export async function getEnrollmentPayments(
  supabase: SupabaseClient<Database>,
  enrollmentId: string
): Promise<QueryResult<Payment[]>> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("created_at", { ascending: false });

  const errMsg = handleError("getEnrollmentPayments", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Get a payment by ID
 */
export async function getPaymentById(
  supabase: SupabaseClient<Database>,
  paymentId: string
): Promise<QueryResult<Payment>> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  const errMsg = handleError("getPaymentById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as Payment | null, error: null };
}

/**
 * Get payment by gateway order ID
 */
export async function getPaymentByGatewayOrderId(
  supabase: SupabaseClient<Database>,
  gatewayOrderId: string
): Promise<QueryResult<Payment & { enrollment: Enrollment }>> {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      enrollment:enrollments!enrollment_id(*)
    `)
    .eq("gateway_order_id", gatewayOrderId)
    .maybeSingle();

  const errMsg = handleError("getPaymentByGatewayOrderId", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as Payment & { enrollment: Enrollment }, error: null };
}

// ─── Instalment Queries ────────────────────────────────────────────

/**
 * Fetch instalment schedule for an enrollment
 */
export async function getInstalmentSchedule(
  supabase: SupabaseClient<Database>,
  enrollmentId: string
): Promise<QueryResult<InstalmentSchedule[]>> {
  const { data, error } = await supabase
    .from("instalment_schedule")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("instalment_no", { ascending: true });

  const errMsg = handleError("getInstalmentSchedule", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch pending instalments for a user
 */
export async function getPendingInstalments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<(InstalmentSchedule & { 
  enrollment: Enrollment & { 
    course: Pick<Course, "id" | "title" | "slug"> 
  } 
})[]>> {
  const { data, error } = await supabase
    .from("instalment_schedule")
    .select(`
      *,
      enrollment:enrollments!enrollment_id(
        *,
        course:courses!course_id(id, title, slug)
      )
    `)
    .in("status", ["pending", "overdue"])
    .order("due_date", { ascending: true });

  const errMsg = handleError("getPendingInstalments", error);
  if (errMsg) return { data: null, error: errMsg };

  // Filter by user (RLS should handle this, but filter client-side for safety)
  const filtered = (data ?? []).filter(
    (inst) => inst.enrollment?.user_id === userId
  );

  return {
    data: filtered as unknown as (InstalmentSchedule & { 
      enrollment: Enrollment & { 
        course: Pick<Course, "id" | "title" | "slug"> 
      } 
    })[],
    error: null,
  };
}

/**
 * Fetch overdue instalments (for reminders)
 */
export async function getOverdueInstalments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<InstalmentSchedule[]>> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("instalment_schedule")
    .select(`
      *,
      enrollment:enrollments!enrollment_id(user_id)
    `)
    .eq("status", "pending")
    .lt("due_date", today);

  const errMsg = handleError("getOverdueInstalments", error);
  if (errMsg) return { data: null, error: errMsg };

  // Filter by user
  const filtered = (data ?? []).filter(
    (inst) => inst.enrollment?.user_id === userId
  );

  return { data: filtered as unknown as InstalmentSchedule[], error: null };
}

// ─── Coupon Queries ────────────────────────────────────────────────

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  supabase: SupabaseClient<Database>,
  code: string,
  orderAmount: number
): Promise<QueryResult<{ valid: boolean; coupon: Coupon | null; error: string | null }>> {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  const errMsg = handleError("validateCoupon", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!coupon) {
    return { data: { valid: false, coupon: null, error: "Invalid coupon code" }, error: null };
  }

  // Check validity dates
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { data: { valid: false, coupon: null, error: "Coupon not yet active" }, error: null };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { data: { valid: false, coupon: null, error: "Coupon has expired" }, error: null };
  }

  // Check usage limit
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { data: { valid: false, coupon: null, error: "Coupon usage limit reached" }, error: null };
  }

  // Check minimum order amount
  if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
    return {
      data: {
        valid: false,
        coupon: null,
        error: `Minimum order amount is ${coupon.min_order_amount}`,
      },
      error: null,
    };
  }

  return { data: { valid: true, coupon: coupon as Coupon, error: null }, error: null };
}

/**
 * Calculate discount amount from coupon
 */
export function calculateDiscount(
  coupon: Coupon,
  orderAmount: number
): { discount: number; finalAmount: number } {
  let discount = 0;

  if (coupon.discount_type === "flat") {
    discount = Math.min(coupon.discount_value, orderAmount);
  } else if (coupon.discount_type === "percent") {
    discount = (orderAmount * coupon.discount_value) / 100;
  }

  // Round to 2 decimal places
  discount = Math.round(discount * 100) / 100;
  const finalAmount = Math.max(0, orderAmount - discount);

  return { discount, finalAmount };
}

// ─── Enrollment Stats ──────────────────────────────────────────────

/**
 * Get enrollment statistics for a user
 */
export async function getUserEnrollmentStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<{
  totalEnrolled: number;
  activeEnrollments: number;
  completedCourses: number;
  expiredEnrollments: number;
}>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", userId);

  const errMsg = handleError("getUserEnrollmentStats", error);
  if (errMsg) return { data: null, error: errMsg };

  const enrollments = data ?? [];
  const stats = {
    totalEnrolled: enrollments.length,
    activeEnrollments: enrollments.filter((e) => e.status === "active").length,
    completedCourses: 0, // This would need to be computed from certificate count
    expiredEnrollments: enrollments.filter((e) => e.status === "expired").length,
  };

  return { data: stats, error: null };
}

/**
 * Get total revenue for a course (admin only)
 */
export async function getCourseRevenue(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<{ total: number; count: number }>> {
  const { data, error } = await supabase
    .from("payments")
    .select("amount_paid")
    .eq("course_id", courseId)
    .eq("status", "paid");

  const errMsg = handleError("getCourseRevenue", error);
  if (errMsg) return { data: null, error: errMsg };

  const payments = data ?? [];
  const total = payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);

  return { data: { total, count: payments.length }, error: null };
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Generate instalment schedule for an EMI plan
 */
export function generateInstalmentSchedule(
  enrollmentId: string,
  plan: PaymentPlan,
  startDate = new Date()
): Omit<InstalmentSchedule, "id" | "payment_id" | "paid_at">[] {
  const schedule: Omit<InstalmentSchedule, "id" | "payment_id" | "paid_at">[] = [];

  for (let i = 1; i <= plan.total_instalments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (i - 1) * plan.frequency_days);

    schedule.push({
      enrollment_id: enrollmentId,
      instalment_no: i,
      due_date: dueDate.toISOString().split("T")[0],
      amount: plan.instalment_amount,
      status: "pending",
    });
  }

  return schedule;
}

/**
 * Check if enrollment has expired
 */
export function isEnrollmentExpired(enrollment: Enrollment): boolean {
  if (!enrollment.expires_at) return false;
  return new Date(enrollment.expires_at) < new Date();
}

/**
 * Get next pending instalment
 */
export function getNextInstalment(
  schedule: InstalmentSchedule[]
): InstalmentSchedule | null {
  return (
    schedule
      .filter((inst) => inst.status === "pending")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] || null
  );
}
