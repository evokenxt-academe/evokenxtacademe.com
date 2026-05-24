import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
        return NextResponse.json(
            { error: "studentId is required" },
            { status: 400 }
        );
    }

    try {
        // Fetch student enrollments with course details
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from("enrollments")
            .select(`
        id,
        status,
        enrolled_at,
        expires_at,
        course_id,
        course:courses(id, title, slug, thumbnail_url)
      `)
            .eq("user_id", studentId)
            .order("enrolled_at", { ascending: false });

        if (enrollmentsError) {
            console.error("Error fetching enrollments:", enrollmentsError);
            // Continue with empty enrollments instead of failing
            return NextResponse.json({
                enrollments: [],
                stats: {
                    totalCoursesEnrolled: 0,
                    activeEnrollments: 0,
                    lecturesWatchedToday: 0,
                    lecturesCompletedToday: 0,
                    totalWatchedTodaySeconds: 0,
                    totalLecturesWatched: 0,
                    totalLecturesCompleted: 0,
                    quizzesAttempted: 0,
                    quizzesPassed: 0,
                    certificatesEarned: 0,
                },
                recentActivity: {
                    quizAttempts: [],
                    certificates: [],
                },
                error: enrollmentsError.message,
            });
        }

        // Fetch today's watch hours
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const watchDate = `${yyyy}-${mm}-${dd}`;

        const { data: dailyWatch, error: dailyWatchError } = await supabase
            .from("watch_hours_daily")
            .select("seconds")
            .eq("user_id", studentId)
            .eq("watch_date", watchDate);

        if (dailyWatchError) {
            console.error("Error fetching daily watch hours:", dailyWatchError);
        }

        const totalWatchedToday = (dailyWatch ?? []).reduce(
            (sum, record) => sum + (record.seconds || 0),
            0
        );

        // Fetch lecture progress for today
        const todayStart = new Date(yyyy, parseInt(mm) - 1, parseInt(dd), 0, 0, 0).toISOString();
        const todayEnd = new Date(yyyy, parseInt(mm) - 1, parseInt(dd), 23, 59, 59).toISOString();

        const { data: todayProgress, error: progressError } = await supabase
            .from("lecture_progress")
            .select("lecture_id, is_completed, watched_seconds")
            .eq("user_id", studentId)
            .gte("last_watched_at", todayStart)
            .lte("last_watched_at", todayEnd);

        if (progressError) {
            console.error("Error fetching lecture progress:", progressError);
        }

        const lecturesWatchedToday = (todayProgress ?? []).length;
        const lecturesCompletedToday = (todayProgress ?? []).filter(
            (p) => p.is_completed
        ).length;

        // Fetch quiz attempts
        const { data: quizAttempts, error: quizError } = await supabase
            .from("quiz_attempts")
            .select(`
        id,
        quiz_id,
        score,
        total_marks,
        passed,
        status,
        submitted_at,
        quiz:quizzes(id, title, passing_marks)
      `)
            .eq("user_id", studentId)
            .eq("status", "submitted")
            .order("submitted_at", { ascending: false })
            .limit(10);

        if (quizError) {
            console.error("Error fetching quiz attempts:", quizError);
        }

        const quizzesAttempted = (quizAttempts ?? []).length;
        const quizzesPassed = (quizAttempts ?? []).filter((q) => q.passed).length;

        // Fetch certificates
        const { data: certificates, error: certError } = await supabase
            .from("certificates")
            .select("id, issued_at, course:courses(name)")
            .eq("user_id", studentId)
            .eq("status", "issued");

        if (certError) {
            console.error("Error fetching certificates:", certError);
        }

        const totalCertificates = (certificates ?? []).length;

        // Fetch total lectures progress
        const { data: allProgress, error: allProgressError } = await supabase
            .from("lecture_progress")
            .select("is_completed")
            .eq("user_id", studentId);

        if (allProgressError) {
            console.error("Error fetching all progress:", allProgressError);
        }

        const totalLecturesCompleted = (allProgress ?? []).filter(
            (p) => p.is_completed
        ).length;
        const totalLecturesWatched = (allProgress ?? []).length;

        return NextResponse.json({
            enrollments: enrollments ?? [],
            stats: {
                totalCoursesEnrolled: (enrollments ?? []).length,
                activeEnrollments: (enrollments ?? []).filter(
                    (e: any) => e.status === "active"
                ).length,
                lecturesWatchedToday,
                lecturesCompletedToday,
                totalWatchedTodaySeconds: totalWatchedToday,
                totalLecturesWatched,
                totalLecturesCompleted,
                quizzesAttempted,
                quizzesPassed,
                certificatesEarned: totalCertificates,
            },
            recentActivity: {
                quizAttempts: quizAttempts ?? [],
                certificates: certificates ?? [],
            },
        });
    } catch (error) {
        console.error("Error in student-details:", error);
        return NextResponse.json(
            { error: "Failed to fetch student details" },
            { status: 500 }
        );
    }
}
