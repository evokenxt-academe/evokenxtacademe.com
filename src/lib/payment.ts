/**
 * ============================================================
 * Evoke EduGlobal LMS v2.0.0 - Payment System
 * ============================================================
 * Razorpay integration with EMI support
 * Handles one-time + instalment payments
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Payment, Enrollment, PaymentPlan, InstalmentSchedule } from "@/types/database.v2.types";
import {
    createPayment,
    updatePaymentStatus,
    updateEnrollmentStatus,
    createInstalmentSchedule,
    getOrCreateEnrollment,
} from "@/lib/supabase/queries.v2";

export interface RazorpayOrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
}

export interface RazorpayPaymentResponse {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    invoice_id?: string;
    international: boolean;
    method: string;
    description?: string;
    amount_refunded: number;
    refund_status?: string;
    captured: boolean;
    description?: string;
    card_id?: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    email: string;
    contact: string;
    created_at: number;
}

// ============================================================
// RAZORPAY API HELPERS
// ============================================================

/**
 * Create Razorpay order for course enrollment
 */
export async function createRazorpayOrder(options: {
    amount: number; // in paise (100 = ₹1)
    enrollmentId: string;
    courseTitle: string;
    userEmail: string;
    userPhone: string;
}): Promise<{ orderId: string; error?: string }> {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!key) {
        return { orderId: "", error: "Razorpay key not configured" };
    }

    try {
        const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${key}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: options.amount,
                currency: "INR",
                receipt: options.enrollmentId,
                description: `Enrollment: ${options.courseTitle}`,
                customer_notify: 1,
                notes: {
                    enrollment_id: options.enrollmentId,
                    course_title: options.courseTitle,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { orderId: "", error: error.error?.description || "Failed to create order" };
        }

        const order = (await response.json()) as RazorpayOrderResponse;
        return { orderId: order.id };
    } catch (error) {
        return { orderId: "", error: String(error) };
    }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
): boolean {
    const crypto = require("crypto");
    const key = process.env.RAZORPAY_KEY_SECRET;

    if (!key) return false;

    const message = `${orderId}|${paymentId}`;
    const generated_signature = crypto.createHmac("sha256", key).update(message).digest("hex");

    return generated_signature === signature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function getRazorpayPaymentDetails(
    paymentId: string,
): Promise<RazorpayPaymentResponse | null> {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key || !secret) {
        console.error("Razorpay credentials not configured");
        return null;
    }

    try {
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch payment:", await response.text());
            return null;
        }

        return (await response.json()) as RazorpayPaymentResponse;
    } catch (error) {
        console.error("Error fetching Razorpay payment:", error);
        return null;
    }
}

// ============================================================
// ENROLLMENT & PAYMENT FLOW
// ============================================================

export interface EnrollmentPaymentOptions {
    supabase: SupabaseClient<Database>;
    userId: string;
    courseId: string;
    pricingId: string;
    planId?: string;
    couponCode?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

/**
 * Complete enrollment with payment verification
 */
export async function completeEnrollmentWithPayment(
    options: EnrollmentPaymentOptions,
): Promise<{
    success: boolean;
    enrollment?: any;
    error?: string;
}> {
    const {
        supabase,
        userId,
        courseId,
        pricingId,
        planId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = options;

    // Step 1: Verify signature
    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        return { success: false, error: "Invalid payment signature" };
    }

    // Step 2: Fetch payment details from Razorpay
    const paymentDetails = await getRazorpayPaymentDetails(razorpayPaymentId);
    if (!paymentDetails) {
        return { success: false, error: "Could not verify payment" };
    }

    if (paymentDetails.status !== "captured") {
        return { success: false, error: "Payment not captured" };
    }

    // Step 3: Create/get enrollment
    const enrollmentResult = await getOrCreateEnrollment(
        supabase,
        userId,
        courseId,
        pricingId,
        planId,
    );

    if (!enrollmentResult.data) {
        return { success: false, error: enrollmentResult.error || "Failed to create enrollment" };
    }

    // Step 4: Record payment
    const paymentResult = await createPayment(supabase, {
        user_id: userId,
        enrollment_id: enrollmentResult.data.id,
        amount: paymentDetails.amount,
        gateway: "razorpay",
        gateway_transaction_id: razorpayPaymentId,
        gateway_order_id: razorpayOrderId,
        gateway_metadata: paymentDetails,
    });

    if (!paymentResult.data) {
        return { success: false, error: paymentResult.error || "Failed to record payment" };
    }

    // Step 5: Update payment status to successful
    await updatePaymentStatus(supabase, paymentResult.data.id, "successful", razorpayPaymentId);

    // Step 6: If EMI plan, create instalment schedule
    if (planId) {
        // Fetch plan details
        const { data: plan } = await supabase
            .from("payment_plans")
            .select("*")
            .eq("id", planId)
            .maybeSingle();

        if (plan && plan.num_installments) {
            await createInstalmentSchedule(supabase, enrollmentResult.data.id, plan);
        }
    }

    // Step 7: Update enrollment status to active
    await updateEnrollmentStatus(supabase, enrollmentResult.data.id, "active");

    return { success: true, enrollment: enrollmentResult.data };
}

// ============================================================
// WEBHOOK HANDLING
// ============================================================

/**
 * Handle Razorpay webhook for payment events
 */
export async function handleRazorpayWebhook(
    supabase: SupabaseClient<Database>,
    payload: any,
    signature: string,
): Promise<{ success: boolean; error?: string }> {
    const crypto = require("crypto");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        return { success: false, error: "Webhook secret not configured" };
    }

    // Verify webhook signature
    const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

    if (generated_signature !== signature) {
        return { success: false, error: "Invalid webhook signature" };
    }

    const { event, payload: eventPayload } = payload;

    try {
        switch (event) {
            case "payment.authorized":
                // Handle payment authorized
                break;

            case "payment.failed":
                // Update payment status to failed
                const paymentId = eventPayload.payment.id;
                await updatePaymentStatus(
                    supabase,
                    paymentId,
                    "failed",
                );
                break;

            case "payment.captured":
                // Already handled in completeEnrollmentWithPayment
                break;

            case "refund.created":
                // Handle refund initiated
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============================================================
// INSTALMENT HELPERS
// ============================================================

/**
 * Get pending instalments for user
 */
export async function getPendingInstalments(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<InstalmentSchedule[]> {
    const { data } = await supabase
        .from("instalment_schedule")
        .select("*")
        .eq("status", "pending")
        .eq("enrollments!inner.user_id", userId);

    return (data ?? []) as InstalmentSchedule[];
}

/**
 * Process instalment payment
 */
export async function processInstalmentPayment(
    supabase: SupabaseClient<Database>,
    instalmentId: string,
    paymentId: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update instalment status
        await supabase
            .from("instalment_schedule")
            .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
            .eq("id", instalmentId);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
