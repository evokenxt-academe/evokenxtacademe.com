/**
 * ============================================================
 * API ROUTE TEMPLATES - Evoke EduGlobal LMS v2.0.0
 * ============================================================
 * Place these in: /src/app/api/[route]/(route).ts
 * Update Next.js patterns as needed for your version
 * 
 * NOTE: This file is commented out to prevent TypeScript duplicate 
 * identifier errors. Copy and uncomment into actual route files.
 */

/*
// ============================================================
// EXAMPLE 1: GET /api/catalog/courses
// ============================================================
// File: src/app/api/catalog/courses/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPublishedCourses } from "@/lib/supabase/queries.v2";

export async function GET(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const searchParams = request.nextUrl.searchParams;
    const programBody = searchParams.get("program");
    const programLevelId = searchParams.get("level");
    const subjectId = searchParams.get("subject");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getPublishedCourses(supabase, {
        programBody: programBody ?? undefined,
        programLevelId: programLevelId ?? undefined,
        subjectId: subjectId ?? undefined,
        limit,
        offset,
    });

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
}

// ============================================================
// EXAMPLE 2: POST /api/enrollment/enroll
// ============================================================
// File: src/app/api/enrollment/enroll/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCoursePricing } from "@/lib/supabase/queries.v2";
import { createRazorpayOrder } from "@/lib/payment";

export async function POST(request: NextRequest) {
    try {
        const { courseId, pricingId, planId, userEmail, userPhone } = await request.json();

        // Get authenticated user
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch pricing & plan
        const pricingResult = await getCoursePricing(supabase, courseId);
        const pricing = pricingResult.data.find((p) => p.id === pricingId);

        if (!pricing) {
            return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
        }

        const plan = pricing.plans?.find((p: any) => p.id === planId);
        const amount = plan?.total_amount || pricing.base_price;

        // Get course title
        const { data: course } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .maybeSingle();

        // Create Razorpay order
        const { orderId, error } = await createRazorpayOrder({
            amount: amount * 100, // Convert to paise
            enrollmentId: `${user.id}-${courseId}`,
            courseTitle: course?.title || "Course",
            userEmail,
            userPhone,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({
            orderId,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 3: POST /api/enrollment/verify-payment
// ============================================================
// File: src/app/api/enrollment/verify-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { completeEnrollmentWithPayment } from "@/lib/payment";

export async function POST(request: NextRequest) {
    try {
        const {
            courseId,
            pricingId,
            planId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Complete enrollment with payment
        const result = await completeEnrollmentWithPayment({
            supabase,
            userId: user.id,
            courseId,
            pricingId,
            planId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            enrollmentId: result.enrollment?.id,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 4: POST /api/progress/update-lecture
// ============================================================
// File: src/app/api/progress/update-lecture/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateLectureProgress } from "@/lib/supabase/queries.v2";

export async function POST(request: NextRequest) {
    try {
        const { lectureId, resumePosition, watchTime, isCompleted } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await updateLectureProgress(
            supabase,
            user.id,
            lectureId,
            {
                resume_position_sec: resumePosition,
                watch_time_sec: watchTime,
                completion_percentage: isCompleted ? 100 : 0,
                is_completed: isCompleted,
            },
        );

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 5: POST /api/quiz/start
// ============================================================
// File: src/app/api/quiz/start/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createQuizAttempt, getQuizDetail } from "@/lib/supabase/queries.v2";

export async function POST(request: NextRequest) {
    try {
        const { quizId } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create attempt
        const attemptResult = await createQuizAttempt(supabase, user.id, quizId);

        if (!attemptResult.data) {
            return NextResponse.json({ error: attemptResult.error }, { status: 400 });
        }

        // Get quiz details
        const quizResult = await getQuizDetail(supabase, quizId);

        return NextResponse.json({
            attemptId: attemptResult.data.id,
            quiz: quizResult.data,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 6: POST /api/quiz/submit
// ============================================================
// File: src/app/api/quiz/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getQuizDetail } from "@/lib/supabase/queries.v2";
import { submitQuizAnswers } from "@/lib/quiz";

export async function POST(request: NextRequest) {
    try {
        const { attemptId, quizId, answers } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        // Get quiz details
        const quizResult = await getQuizDetail(supabase, quizId);

        if (!quizResult.data) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        // Submit answers and calculate score
        const submitResult = await submitQuizAnswers({
            supabase,
            attemptId,
            answers,
            quizDetail: quizResult.data,
        });

        if (!submitResult.success) {
            return NextResponse.json({ error: submitResult.error }, { status: 400 });
        }

        return NextResponse.json(submitResult.score);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 7: GET /api/dashboard/enrollments
// ============================================================
// File: src/app/api/dashboard/enrollments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserEnrollments } from "@/lib/supabase/queries.v2";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await getUserEnrollments(supabase, user.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 8: POST /api/review/submit
// ============================================================
// File: src/app/api/review/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { upsertReview } from "@/lib/supabase/queries.v2";

export async function POST(request: NextRequest) {
    try {
        const { courseId, rating, title, comment } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await upsertReview(supabase, user.id, courseId, {
            rating,
            title,
            comment,
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// ============================================================
// EXAMPLE 9: GET /api/certificates
// ============================================================
// File: src/app/api/certificates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserCertificates } from "@/lib/supabase/queries.v2";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await getUserCertificates(supabase, user.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
*/
