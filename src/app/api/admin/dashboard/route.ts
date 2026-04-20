import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    computeMonthlySeries,
    createLookupMap,
    normalizeCourse,
    normalizeEnrollment,
    normalizeLiveStream,
    normalizePayment,
    normalizeQuiz,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers";

const toMonthKey = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

const formatPercent = (current: number, previous: number) => {
    if (previous <= 0) {
        return current > 0 ? "+100.0%" : "+0.0%";
    }

    const delta = ((current - previous) / previous) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
};

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [usersResult, coursesResult, paymentsResult, enrollmentsResult, streamsResult, quizzesResult] =
        await Promise.all([
            supabase.from("users").select("*").order("created_at", { ascending: false }),
            supabase.from("courses").select("*").order("created_at", { ascending: false }),
            supabase.from("payments").select("*").order("created_at", { ascending: false }),
            supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
            supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false }),
            supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
        ]);

    const errors = [
        usersResult.error,
        coursesResult.error,
        paymentsResult.error,
        enrollmentsResult.error,
        streamsResult.error,
        quizzesResult.error,
    ].filter(Boolean);

    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load dashboard data";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const courses = (coursesResult.data ?? []).map((row) => {
        const instructor = users.find((user) => user.id === String((row as Record<string, unknown>).instructor_id))?.name;
        return normalizeCourse(row as Record<string, unknown>, instructor);
    });
    const userMap = createLookupMap(users);
    const courseMap = createLookupMap(courses);

    const payments = (paymentsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const user = userMap.get(String(record.user_id ?? record.student_id))?.name;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizePayment(record, user, course);
    });
    const enrollments = (enrollmentsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const user = userMap.get(String(record.user_id))?.name;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizeEnrollment(record, user, course);
    });
    const liveStreams = (streamsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const course = courseMap.get(String(record.course_id))?.name;
        return normalizeLiveStream(record, course);
    });
    const quizzes = (quizzesResult.data ?? []).map(normalizeQuiz);

    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const countInMonth = (dates: string[], monthIndex: number, year: number) =>
        dates.filter((dateString) => toMonthKey(dateString) === `${year}-${monthIndex}`).length;

    const userDates = users.map((user) => user.createdAt);
    const courseDates = courses.map((course) => course.createdAt);
    const activeEnrollmentDates = enrollments
        .filter((enrollment) => enrollment.status === "active")
        .map((enrollment) => enrollment.expiresAt);

    const revenueThisMonth = payments.reduce((sum, payment) => {
        const monthKey = toMonthKey(payment.createdAt);
        return monthKey === `${currentYear}-${currentMonth}` && payment.status === "paid"
            ? sum + payment.amount
            : sum;
    }, 0);

    const revenuePreviousMonth = payments.reduce((sum, payment) => {
        const monthKey = toMonthKey(payment.createdAt);
        return monthKey === `${previousMonthYear}-${previousMonth}` && payment.status === "paid"
            ? sum + payment.amount
            : sum;
    }, 0);

    const recentActivity = [
        ...payments.slice(0, 2).map((payment) => ({
            id: `payment-${payment.id}`,
            title: payment.status === "paid" ? "Payment received" : "Payment updated",
            description: `${payment.user} paid ${formatCurrency(payment.amount)} for ${payment.course}.`,
            time: payment.createdAt,
            tone: payment.status === "paid" ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        })),
        ...enrollments.slice(0, 2).map((enrollment) => ({
            id: `enrollment-${enrollment.id}`,
            title: enrollment.status === "active" ? "New enrollment" : "Enrollment updated",
            description: `${enrollment.user} is now ${enrollment.status} in ${enrollment.course}.`,
            time: enrollment.expiresAt,
            tone: enrollment.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        })),
        ...liveStreams.slice(0, 1).map((stream) => ({
            id: `stream-${stream.id}`,
            title: stream.status === "live" ? "Stream went live" : "Stream scheduled",
            description: `${stream.title} for ${stream.course} is ${stream.status}.`,
            time: stream.scheduledAt,
            tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        })),
        ...quizzes.slice(0, 1).map((quiz) => ({
            id: `quiz-${quiz.id}`,
            title: quiz.published ? "Quiz published" : "Quiz drafted",
            description: `${quiz.title} is currently ${quiz.published ? "live" : "in draft"}.`,
            time: currentDate.toISOString(),
            tone: quiz.published ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-muted text-muted-foreground",
        })),
    ]
        .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
        .slice(0, 4);

    return NextResponse.json({
        stats: [
            {
                label: "Total Users",
                value: String(users.length),
                delta: formatPercent(
                    countInMonth(userDates, currentMonth, currentYear),
                    countInMonth(userDates, previousMonth, previousMonthYear),
                ),
            },
            {
                label: "Total Courses",
                value: String(courses.length),
                delta: formatPercent(
                    countInMonth(courseDates, currentMonth, currentYear),
                    countInMonth(courseDates, previousMonth, previousMonthYear),
                ),
            },
            {
                label: "Revenue",
                value: formatCurrency(revenueThisMonth),
                delta: formatPercent(revenueThisMonth, revenuePreviousMonth),
            },
            {
                label: "Active Enrollments",
                value: String(enrollments.filter((enrollment) => enrollment.status === "active").length),
                delta: formatPercent(
                    countInMonth(activeEnrollmentDates, currentMonth, currentYear),
                    countInMonth(activeEnrollmentDates, previousMonth, previousMonthYear),
                ),
            },
        ],
        revenueSeries: computeMonthlySeries(
            payments.filter((payment) => payment.status === "paid"),
            (payment) => payment.amount,
        ).map((entry) => ({ month: entry.month, revenue: entry.value })),
        growthSeries: computeMonthlySeries(users, () => 1).map((entry) => ({
            month: entry.month,
            users: entry.value,
        })),
        recentActivity,
        operationsSnapshot: [
            {
                label: "Pending payments",
                value: String(payments.filter((payment) => payment.status === "pending").length),
                note: "Requires review or retry",
            },
            {
                label: "Live streams today",
                value: String(liveStreams.filter((stream) => stream.status === "live").length),
                note: "One currently active",
            },
            {
                label: "Published quizzes",
                value: String(quizzes.filter((quiz) => quiz.published).length),
                note: "Ready for learner access",
            },
            {
                label: "Active enrollments",
                value: String(enrollments.filter((enrollment) => enrollment.status === "active").length),
                note: "Valid access windows",
            },
        ],
    });
}