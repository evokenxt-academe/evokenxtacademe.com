"use server";

/**
 * Razorpay Payment Integration
 * Supports one-time payments and EMI plans
 */

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

interface EMIPlan {
  id: string;
  period: string;
  interval: number;
  period_count: number;
  notes: Record<string, any>;
}

export interface CreateOrderParams {
  courseId: string;
  userId: string;
  email: string;
  amount: number;
  currency?: string;
  emiPlan?: EMIPlan;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Create a Razorpay order for course enrollment
 */
export async function createRazorpayOrder({
  courseId,
  userId,
  email,
  amount,
  currency = "INR",
  emiPlan,
}: CreateOrderParams) {
  const apiKey = process.env.RAZORPAY_API_KEY;
  const apiSecret = process.env.RAZORPAY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return { error: "Razorpay credentials not configured" };
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const orderData = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `order_${courseId}_${userId}_${Date.now()}`,
      notes: {
        courseId,
        userId,
        email,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.text();
      return { error: `Failed to create order: ${error}` };
    }

    const order = (await response.json()) as RazorpayOrder;

    return {
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      status: order.status,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Verify payment signature
 */
export async function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: VerifyPaymentParams) {
  const crypto = require("crypto");
  const apiSecret = process.env.RAZORPAY_API_SECRET;

  if (!apiSecret) {
    return { error: "Razorpay credentials not configured" };
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", apiSecret)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === signature;

    if (!isValid) {
      return { error: "Invalid payment signature" };
    }

    return { valid: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get available EMI plans for a course
 */
export function getEMIPlans(coursePrice: number) {
  const plans = [
    {
      months: 3,
      monthlyAmount: Math.ceil(coursePrice / 3),
      emi: 0.015, // 1.5% per month
    },
    {
      months: 6,
      monthlyAmount: Math.ceil(coursePrice / 6),
      emi: 0.012, // 1.2% per month
    },
    {
      months: 12,
      monthlyAmount: Math.ceil(coursePrice / 12),
      emi: 0.01, // 1% per month
    },
  ];

  return plans.map((plan) => ({
    ...plan,
    totalWithInterest: plan.monthlyAmount * plan.months * (1 + plan.emi * plan.months),
  }));
}

/**
 * Calculate EMI breakdown
 */
export function calculateEMI(
  principal: number,
  ratePerMonth: number,
  months: number
) {
  const monthlyRate = ratePerMonth / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const breakdown = [];
  let remainingPrincipal = principal;

  for (let i = 1; i <= months; i++) {
    const interestPayment = remainingPrincipal * monthlyRate;
    const principalPayment = emi - interestPayment;
    remainingPrincipal -= principalPayment;

    breakdown.push({
      month: i,
      emi: emi,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, remainingPrincipal),
    });
  }

  return {
    monthlyEMI: emi,
    totalAmount: emi * months,
    totalInterest: emi * months - principal,
    breakdown,
  };
}

/**
 * Record payment in database
 */
export async function recordPayment(
  supabase: any,
  enrollmentId: string,
  paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    amount: number;
    method: "one-time" | "emi";
    emiMonths?: number;
  }
) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        enrollment_id: enrollmentId,
        razorpay_order_id: paymentData.razorpayOrderId,
        razorpay_payment_id: paymentData.razorpayPaymentId,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        emi_months: paymentData.emiMonths,
        status: "completed",
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { payment: data };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
