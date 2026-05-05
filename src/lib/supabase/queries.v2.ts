/**
 * ============================================================
 * Evoke EduGlobal LMS v2.0.0 - Supabase Query Layer
 * ============================================================
 * Strict RLS-aware queries with full type safety
 * All queries respect Row-Level Security policies
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    Database,
    Course,
    CourseDetail,
    Chapter,
    Lecture,
    Enrollment,
    EnrollmentDetail,
    Quiz,
    QuizDetail,
    Question,
    QuestionOption,
    QuizAttempt,
    AttemptDetail,
    LectureProgress,
    Certificate,
    LiveStream,
    Review,
    Program,
    ProgramLevel,
    Subject,
    CoursePricing,
    PaymentPlan,
    Payment,
    StudyMaterial,
    User,
    StudentProfile,
    InstalmentSchedule,
} from "@/types/database.v2.types";

// ============================================================
// RESULT TYPE HELPERS
// ============================================================

export interface QueryResult<T> {
    data: T | null;
    error: string | null;
}

export interface QueryResultList<T> {
    data: T[];
    error: string | null;
}

function handleError(scope: string, error: any): string | null {
    if (!error) return null;
    const msg = error.message ?? JSON.stringify(error);
    console.error(`[queries.v2] ${scope}: ${msg}`);
    return msg;
}

// ============================================================
// PROGRAMS & CATALOG
// ============================================================

/**
 * Get all active programs (ACCA, CFA, CMA)
 */
export async function getPrograms(
    supabase: SupabaseClient<Database>,
): Promise<QueryResultList<Program>> {
    const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .order("body");

    return {
        data: (data ?? []) as Program[],
        error: handleError("getPrograms", error),
    };
}

/**
 * Get program with all levels and subjects
 */
export async function getProgramWithLevels(
    supabase: SupabaseClient<Database>,
    programId: string,
): Promise<QueryResult<Program & { program_levels?: (ProgramLevel & { subjects?: Subject[] })[] }>> {
    const { data, error } = await supabase
        .from("programs")
        .select(
            `
      *,
      program_levels(
        *,
        subjects(*)
      )
    `,
        )
        .eq("id", programId)
        .maybeSingle();

    return {
        data: data as any,
        error: handleError("getProgramWithLevels", error),
    };
}

// ============================================================
// COURSES - PUBLIC CATALOG
// ============================================================

/**
 * Get all published courses with instructor + program hierarchy
 */
export async function getPublishedCourses(
    supabase: SupabaseClient<Database>,
    options?: {
        programBody?: string;
        programLevelId?: string;
        subjectId?: string;
        limit?: number;
        offset?: number;
    },
): Promise<QueryResultList<CourseDetail>> {
    let query = supabase
        .from("courses")
        .select(
            `
      *,
      instructor:users!instructor_id(id, name, avatar, email),
      subject:subjects(
        *,
        program_level:program_levels(
          *,
          program:programs(*)
        )
      ),
      chapters(id),
      pricing:course_pricing(is_active),
      reviews(rating)
    `,
        )
        .eq("status", "published");

    if (options?.programBody) {
        // Filter by program body through subject hierarchy
        query = query
            .eq("subject.program_level.program.body", options.programBody);
    }

    if (options?.programLevelId) {
        query = query
            .eq("subject.program_level_id", options.programLevelId);
    }

    if (options?.subjectId) {
        query = query.eq("subject_id", options.subjectId);
    }

    query = query.order("created_at", { ascending: false });

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
    }

    const { data, error } = await query;

    return {
        data: (data ?? []) as CourseDetail[],
        error: handleError("getPublishedCourses", error),
    };
}

/**
 * Get course by slug with full details
 */
export async function getCourseBySlug(
    supabase: SupabaseClient<Database>,
    slug: string,
): Promise<QueryResult<CourseDetail>> {
    const { data, error } = await supabase
        .from("courses")
        .select(
            `
      *,
      instructor:users!instructor_id(id, name, avatar, email),
      subject:subjects(
        *,
        program_level:program_levels(
          *,
          program:programs(*)
        )
      ),
      chapters(id, title, position, description),
      pricing:course_pricing(is_active),
      study_materials(is_published),
      reviews(rating, title, comment, is_approved)
    `,
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    return {
        data: data as CourseDetail | null,
        error: handleError("getCourseBySlug", error),
    };
}

/**
 * Get course by ID (authenticated - respects RLS)
 */
export async function getCourseById(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResult<CourseDetail>> {
    const { data, error } = await supabase
        .from("courses")
        .select(
            `
      *,
      instructor:users!instructor_id(id, name, avatar, email),
      subject:subjects(
        *,
        program_level:program_levels(
          *,
          program:programs(*)
        )
      ),
      chapters(id, title, position, description),
      pricing:course_pricing(is_active),
      study_materials(is_published)
    `,
        )
        .eq("id", courseId)
        .maybeSingle();

    return {
        data: data as CourseDetail | null,
        error: handleError("getCourseById", error),
    };
}

// ============================================================
// CHAPTERS & LECTURES
// ============================================================

/**
 * Get chapters for a course with lecture count
 */
export async function getChaptersForCourse(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<Chapter & { lectures?: Lecture[] }>> {
    const { data, error } = await supabase
        .from("chapters")
        .select(
            `
      *,
      lectures(id, title, duration_sec, is_preview, is_published, position)
    `,
        )
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("position");

    return {
        data: (data ?? []) as (Chapter & { lectures?: Lecture[] })[],
        error: handleError("getChaptersForCourse", error),
    };
}

/**
 * Get all lectures for a course
 */
export async function getLecturesForCourse(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<Lecture & { resources?: any[] }>> {
    const { data, error } = await supabase
        .from("lectures")
        .select(
            `
      *,
      chapter:chapters(course_id),
      lecture_resources(id, title, file_url, file_type)
    `,
        )
        .eq("chapters.course_id", courseId)
        .eq("is_published", true)
        .order("chapter!inner.position, position");

    return {
        data: (data ?? []) as (Lecture & { resources?: any[] })[],
        error: handleError("getLecturesForCourse", error),
    };
}

/**
 * Get lecture by ID with resources
 */
export async function getLectureById(
    supabase: SupabaseClient<Database>,
    lectureId: string,
): Promise<QueryResult<Lecture & { chapter?: Chapter; resources?: any[] }>> {
    const { data, error } = await supabase
        .from("lectures")
        .select(
            `
      *,
      chapter:chapters(*),
      lecture_resources(id, title, file_url, file_type, file_size_bytes)
    `,
        )
        .eq("id", lectureId)
        .maybeSingle();

    return {
        data: data as any,
        error: handleError("getLectureById", error),
    };
}

// ============================================================
// STUDY MATERIALS
// ============================================================

/**
 * Get study materials for a course
 */
export async function getStudyMaterialsForCourse(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<StudyMaterial>> {
    const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

    return {
        data: (data ?? []) as StudyMaterial[],
        error: handleError("getStudyMaterialsForCourse", error),
    };
}

// ============================================================
// ENROLLMENTS
// ============================================================

/**
 * Get user's active enrollments
 */
export async function getUserEnrollments(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<QueryResultList<EnrollmentDetail>> {
    const { data, error } = await supabase
        .from("enrollments")
        .select(
            `
      *,
      course:courses(
        id, title, slug, thumbnail_url,
        subject:subjects(
          program_level:program_levels(
            program:programs(body)
          )
        )
      ),
      pricing:course_pricing(*),
      plan:payment_plans(*),
      payments(id, status, amount, created_at),
      instalments:instalment_schedule(id, status, due_date, amount)
    `,
        )
        .eq("user_id", userId)
        .in("status", ["active", "completed"])
        .order("enrolled_at", { ascending: false });

    return {
        data: (data ?? []) as EnrollmentDetail[],
        error: handleError("getUserEnrollments", error),
    };
}

/**
 * Check if user is enrolled in course
 */
export async function isUserEnrolled(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string,
): Promise<QueryResult<boolean>> {
    const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

    return {
        data: data !== null,
        error: handleError("isUserEnrolled", error),
    };
}

/**
 * Get or create enrollment
 */
export async function getOrCreateEnrollment(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string,
    pricingId: string,
    planId?: string,
): Promise<QueryResult<Enrollment>> {
    // Try to get existing
    const { data: existing } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

    if (existing) {
        return { data: existing as Enrollment, error: null };
    }

    // Create new
    const { data, error } = await supabase
        .from("enrollments")
        .insert({
            user_id: userId,
            course_id: courseId,
            pricing_id: pricingId,
            plan_id: planId ?? null,
            status: "active",
            enrolled_at: new Date().toISOString(),
        } as any)
        .select()
        .maybeSingle();

    return {
        data: data as Enrollment | null,
        error: handleError("getOrCreateEnrollment", error),
    };
}

/**
 * Update enrollment status
 */
export async function updateEnrollmentStatus(
    supabase: SupabaseClient<Database>,
    enrollmentId: string,
    status: "active" | "completed" | "expired" | "paused",
): Promise<QueryResult<Enrollment>> {
    const { data, error } = await supabase
        .from("enrollments")
        .update({ status })
        .eq("id", enrollmentId)
        .select()
        .maybeSingle();

    return {
        data: data as Enrollment | null,
        error: handleError("updateEnrollmentStatus", error),
    };
}

// ============================================================
// PRICING & PAYMENT PLANS
// ============================================================

/**
 * Get pricing options for a course
 */
export async function getCoursePricing(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<CoursePricing & { plans?: PaymentPlan[] }>> {
    const { data, error } = await supabase
        .from("course_pricing")
        .select(
            `
      *,
      payment_plans(*)
    `,
        )
        .eq("course_id", courseId)
        .eq("is_active", true);

    return {
        data: (data ?? []) as (CoursePricing & { plans?: PaymentPlan[] })[],
        error: handleError("getCoursePricing", error),
    };
}

// ============================================================
// PAYMENTS
// ============================================================

/**
 * Create payment record
 */
export async function createPayment(
    supabase: SupabaseClient<Database>,
    payment: {
        user_id: string;
        enrollment_id: string;
        amount: number;
        gateway: string;
        gateway_order_id?: string;
        gateway_metadata?: any;
    },
): Promise<QueryResult<Payment>> {
    const { data, error } = await supabase
        .from("payments")
        .insert({
            ...payment,
            status: "pending",
        } as any)
        .select()
        .maybeSingle();

    return {
        data: data as Payment | null,
        error: handleError("createPayment", error),
    };
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
    supabase: SupabaseClient<Database>,
    paymentId: string,
    status: "pending" | "successful" | "failed" | "refunded" | "partially_paid",
    gatewayTransactionId?: string,
): Promise<QueryResult<Payment>> {
    const { data, error } = await supabase
        .from("payments")
        .update({
            status,
            gateway_transaction_id: gatewayTransactionId,
            paid_at: status === "successful" ? new Date().toISOString() : null,
        })
        .eq("id", paymentId)
        .select()
        .maybeSingle();

    return {
        data: data as Payment | null,
        error: handleError("updatePaymentStatus", error),
    };
}

/**
 * Get user's payments
 */
export async function getUserPayments(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<QueryResultList<Payment & { enrollment?: Enrollment }>> {
    const { data, error } = await supabase
        .from("payments")
        .select(
            `
      *,
      enrollment:enrollments(id, course_id)
    `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return {
        data: (data ?? []) as (Payment & { enrollment?: Enrollment })[],
        error: handleError("getUserPayments", error),
    };
}

// ============================================================
// INSTALMENTS
// ============================================================

/**
 * Create instalment schedule for EMI plan
 */
export async function createInstalmentSchedule(
    supabase: SupabaseClient<Database>,
    enrollmentId: string,
    plan: PaymentPlan,
): Promise<QueryResultList<InstalmentSchedule>> {
    if (!plan.num_installments) {
        return { data: [], error: "Plan has no installments" };
    }

    const instalments: any[] = [];
    const startDate = new Date();

    for (let i = 1; i <= plan.num_installments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        instalments.push({
            enrollment_id: enrollmentId,
            instalment_no: i,
            amount: plan.installment_amount,
            due_date: dueDate.toISOString().split("T")[0],
            status: "pending",
        });
    }

    const { data, error } = await supabase
        .from("instalment_schedule")
        .insert(instalments)
        .select();

    return {
        data: (data ?? []) as InstalmentSchedule[],
        error: handleError("createInstalmentSchedule", error),
    };
}

// ============================================================
// LECTURE PROGRESS
// ============================================================

/**
 * Get or create lecture progress
 */
export async function getOrCreateLectureProgress(
    supabase: SupabaseClient<Database>,
    userId: string,
    lectureId: string,
): Promise<QueryResult<LectureProgress>> {
    const { data, error } = await supabase
        .from("lecture_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("lecture_id", lectureId)
        .maybeSingle();

    if (data) {
        return { data: data as LectureProgress, error: null };
    }

    // Create new
    const { data: newProgress, error: createError } = await supabase
        .from("lecture_progress")
        .insert({
            user_id: userId,
            lecture_id: lectureId,
            resume_position_sec: 0,
            watch_time_sec: 0,
            completion_percentage: 0,
            is_completed: false,
        } as any)
        .select()
        .maybeSingle();

    return {
        data: newProgress as LectureProgress | null,
        error: handleError("getOrCreateLectureProgress", createError),
    };
}

/**
 * Update lecture progress (resume position + watch time)
 */
export async function updateLectureProgress(
    supabase: SupabaseClient<Database>,
    userId: string,
    lectureId: string,
    update: {
        resume_position_sec?: number;
        watch_time_sec?: number;
        completion_percentage?: number;
        is_completed?: boolean;
    },
): Promise<QueryResult<LectureProgress>> {
    const { data, error } = await supabase
        .from("lecture_progress")
        .update(update)
        .eq("user_id", userId)
        .eq("lecture_id", lectureId)
        .select()
        .maybeSingle();

    return {
        data: data as LectureProgress | null,
        error: handleError("updateLectureProgress", error),
    };
}

/**
 * Get course progress for user
 */
export async function getCourseProgress(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string,
): Promise<QueryResult<{
    enrollmentId: string;
    totalLectures: number;
    completedLectures: number;
    completionPercentage: number;
    totalWatchTime: number;
}>> {
    const { data, error } = await supabase
        .from("lecture_progress")
        .select("*, lectures!inner(chapter:chapters!inner(course_id))")
        .eq("user_id", userId)
        .eq("lectures.chapter.course_id", courseId);

    if (error) {
        return {
            data: null,
            error: handleError("getCourseProgress", error),
        };
    }

    const enrollmentQuery = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

    const enrollmentId = enrollmentQuery.data?.id;
    const lecturesQuery = await supabase
        .from("lectures")
        .select("id")
        .eq("chapters!inner.course_id", courseId);

    const totalLectures = lecturesQuery.data?.length ?? 0;
    const completedLectures = (data ?? []).filter((p: any) => p.is_completed).length;

    return {
        data: {
            enrollmentId: enrollmentId ?? "",
            totalLectures,
            completedLectures,
            completionPercentage: totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0,
            totalWatchTime: (data ?? []).reduce((sum: number, p: any) => sum + (p.watch_time_sec ?? 0), 0),
        },
        error: null,
    };
}

// ============================================================
// QUIZZES
// ============================================================

/**
 * Get quizzes for course or chapter
 */
export async function getQuizzesForCourse(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<Quiz>> {
    const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("created_at");

    return {
        data: (data ?? []) as Quiz[],
        error: handleError("getQuizzesForCourse", error),
    };
}

/**
 * Get quiz with all questions and options
 */
export async function getQuizDetail(
    supabase: SupabaseClient<Database>,
    quizId: string,
): Promise<QueryResult<QuizDetail>> {
    const { data, error } = await supabase
        .from("quizzes")
        .select(
            `
      *,
      questions(
        *,
        options:question_options(*)
      )
    `,
        )
        .eq("id", quizId)
        .maybeSingle();

    return {
        data: data as QuizDetail | null,
        error: handleError("getQuizDetail", error),
    };
}

// ============================================================
// QUIZ ATTEMPTS
// ============================================================

/**
 * Create quiz attempt
 */
export async function createQuizAttempt(
    supabase: SupabaseClient<Database>,
    userId: string,
    quizId: string,
): Promise<QueryResult<QuizAttempt>> {
    const { data, error } = await supabase
        .from("quiz_attempts")
        .insert({
            user_id: userId,
            quiz_id: quizId,
            status: "in_progress",
            started_at: new Date().toISOString(),
        } as any)
        .select()
        .maybeSingle();

    return {
        data: data as QuizAttempt | null,
        error: handleError("createQuizAttempt", error),
    };
}

/**
 * Get quiz attempts for user
 */
export async function getUserQuizAttempts(
    supabase: SupabaseClient<Database>,
    userId: string,
    quizId: string,
): Promise<QueryResultList<QuizAttempt>> {
    const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", userId)
        .eq("quiz_id", quizId)
        .order("started_at", { ascending: false });

    return {
        data: (data ?? []) as QuizAttempt[],
        error: handleError("getUserQuizAttempts", error),
    };
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(
    supabase: SupabaseClient<Database>,
    attemptId: string,
    score: number,
    totalMarks: number,
): Promise<QueryResult<QuizAttempt>> {
    const percentage = (score / totalMarks) * 100;

    const { data, error } = await supabase
        .from("quiz_attempts")
        .update({
            status: "submitted",
            submitted_at: new Date().toISOString(),
            score,
            total_marks: totalMarks,
            percentage: Math.round(percentage),
        })
        .eq("id", attemptId)
        .select()
        .maybeSingle();

    return {
        data: data as QuizAttempt | null,
        error: handleError("submitQuizAttempt", error),
    };
}

// ============================================================
// CERTIFICATES
// ============================================================

/**
 * Get or create certificate
 */
export async function getOrCreateCertificate(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string,
): Promise<QueryResult<Certificate>> {
    // Try to get existing
    const { data: existing } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

    if (existing) {
        return { data: existing as Certificate, error: null };
    }

    // Generate new cert number
    const certNumber = `EVK-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data, error } = await supabase
        .from("certificates")
        .insert({
            user_id: userId,
            course_id: courseId,
            certificate_number: certNumber,
            status: "issued",
            issued_date: new Date().toISOString().split("T")[0],
        } as any)
        .select()
        .maybeSingle();

    return {
        data: data as Certificate | null,
        error: handleError("getOrCreateCertificate", error),
    };
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<QueryResultList<Certificate & { course?: Course }>> {
    const { data, error } = await supabase
        .from("certificates")
        .select(
            `
      *,
      course:courses(id, title, slug)
    `,
        )
        .eq("user_id", userId)
        .eq("status", "issued")
        .order("issued_date", { ascending: false });

    return {
        data: (data ?? []) as (Certificate & { course?: Course })[],
        error: handleError("getUserCertificates", error),
    };
}

// ============================================================
// REVIEWS
// ============================================================

/**
 * Create or update review
 */
export async function upsertReview(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string,
    review: {
        rating: number;
        title: string;
        comment?: string;
    },
): Promise<QueryResult<Review>> {
    const { data, error } = await supabase
        .from("reviews")
        .upsert(
            {
                user_id: userId,
                course_id: courseId,
                rating: review.rating,
                title: review.title,
                comment: review.comment,
                is_verified_purchase: true,
                is_approved: false, // Moderated by admin
            } as any,
            { onConflict: "user_id, course_id" },
        )
        .select()
        .maybeSingle();

    return {
        data: data as Review | null,
        error: handleError("upsertReview", error),
    };
}

/**
 * Get reviews for course
 */
export async function getApprovedReviewsForCourse(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<Review & { user?: User }>> {
    const { data, error } = await supabase
        .from("reviews")
        .select(
            `
      *,
      user:users(id, name, avatar)
    `,
        )
        .eq("course_id", courseId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

    return {
        data: (data ?? []) as (Review & { user?: User })[],
        error: handleError("getApprovedReviewsForCourse", error),
    };
}

// ============================================================
// LIVE STREAMS
// ============================================================

/**
 * Get upcoming live streams for course
 */
export async function getUpcomingStreams(
    supabase: SupabaseClient<Database>,
    courseId: string,
): Promise<QueryResultList<LiveStream>> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("course_id", courseId)
        .in("status", ["scheduled", "live"])
        .gte("scheduled_start", now)
        .order("scheduled_start");

    return {
        data: (data ?? []) as LiveStream[],
        error: handleError("getUpcomingStreams", error),
    };
}

// ============================================================
// USER PROFILE
// ============================================================

/**
 * Get student profile
 */
export async function getStudentProfile(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<QueryResult<StudentProfile>> {
    const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    return {
        data: data as StudentProfile | null,
        error: handleError("getStudentProfile", error),
    };
}

/**
 * Update student profile
 */
export async function updateStudentProfile(
    supabase: SupabaseClient<Database>,
    userId: string,
    profile: Partial<StudentProfile>,
): Promise<QueryResult<StudentProfile>> {
    const { data, error } = await supabase
        .from("student_profiles")
        .update(profile)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

    return {
        data: data as StudentProfile | null,
        error: handleError("updateStudentProfile", error),
    };
}
