/**
 * Analytics Query Layer
 * ======================
 * Queries for watch hours, engagement, and performance analytics
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.v2.types";

export interface WatchHourRow {
    date: string;
    total_hours: number;
    acca_hours: number;
    cfa_hours: number;
    cma_hours: number;
}

export interface StudentWatchRow {
    rank: number;
    student_name: string;
    student_email: string;
    course_title: string;
    total_hours: number;
    last_active: string;
}

/**
 * Get watch hours data by date range
 */
export async function getWatchHoursByDateRange(
    supabase: any,
    dateFrom: string,
    dateTo: string
): Promise<WatchHourRow[]> {
    const { data, error } = await supabase
        .from("lecture_progress")
        .select(
            `watched_at, duration_minutes,
       lecture:lectures(
         chapter:chapters(
           course:courses(
             subject:subjects(
               program_level:program_levels(
                 program:programs(body)
               )
             )
           )
         )
       )`
        )
        .gte("watched_at", dateFrom)
        .lte("watched_at", dateTo);

    if (error) {
        console.error(
            "[analytics] getWatchHoursByDateRange error:",
            error.message
        );
        return [];
    }

    // Group by date and program
    const grouped: Record<string, WatchHourRow> = {};

    (data ?? []).forEach((record: any) => {
        const date = new Date(record.watched_at).toLocaleDateString("en-IN");
        const program = record.lecture?.chapter?.course?.subject?.program_level?.program?.body || "Unknown";
        const duration = record.duration_minutes || 0;

        if (!grouped[date]) {
            grouped[date] = {
                date,
                total_hours: 0,
                acca_hours: 0,
                cfa_hours: 0,
                cma_hours: 0,
            };
        }

        const hours = duration / 60;
        grouped[date].total_hours += hours;

        if (program === "ACCA") grouped[date].acca_hours += hours;
        else if (program === "CFA") grouped[date].cfa_hours += hours;
        else if (program === "CMA") grouped[date].cma_hours += hours;
    });

    return Object.values(grouped).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

/**
 * Get top students by watch hours
 */
export async function getTopStudentsByWatchHours(
    supabase: any,
    limit: number = 20,
    dateFrom?: string,
    dateTo?: string
): Promise<StudentWatchRow[]> {
    let query = supabase
        .from("lecture_progress")
        .select(
            `duration_minutes, watched_at,
       user:users(name, email),
       lecture:lectures(
         chapter:chapters(
           course:courses(title)
         )
       )`
        );

    if (dateFrom) query = query.gte("watched_at", dateFrom);
    if (dateTo) query = query.lte("watched_at", dateTo);

    const { data, error } = await query;

    if (error) {
        console.error(
            "[analytics] getTopStudentsByWatchHours error:",
            error.message
        );
        return [];
    }

    // Group by student and sum hours
    const studentMap: Record<
        string,
        {
            name: string;
            email: string;
            course: string;
            total_minutes: number;
            last_watched: Date;
        }
    > = {};

    (data ?? []).forEach((record: any) => {
        const key = record.user?.email || "unknown";
        const duration = record.duration_minutes || 0;
        const watched = new Date(record.watched_at);

        if (!studentMap[key]) {
            studentMap[key] = {
                name: record.user?.name || "Unknown",
                email: record.user?.email || "unknown",
                course: record.lecture?.chapter?.course?.title || "Unknown",
                total_minutes: 0,
                last_watched: watched,
            };
        }

        studentMap[key].total_minutes += duration;
        if (watched > studentMap[key].last_watched) {
            studentMap[key].last_watched = watched;
        }
    });

    // Sort by total hours and return top N
    return Object.values(studentMap)
        .sort((a, b) => b.total_minutes - a.total_minutes)
        .slice(0, limit)
        .map((student, index) => ({
            rank: index + 1,
            student_name: student.name,
            student_email: student.email,
            course_title: student.course,
            total_hours: Math.round((student.total_minutes / 60) * 10) / 10, // Round to 1 decimal
            last_active: student.last_watched.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        }));
}

/**
 * Get analytics metrics
 */
export async function getAnalyticsMetrics(
    supabase: any,
    dateFrom: string,
    dateTo: string
): Promise<{
    total_watch_hours: number;
    avg_watch_hours_per_student: number;
    most_watched_course: string;
    most_active_day: string;
}> {
    const { data, error } = await supabase
        .from("lecture_progress")
        .select(
            `duration_minutes, watched_at,
       user_id,
       lecture:lectures(
         chapter:chapters(
           course:courses(title)
         )
       )`
        )
        .gte("watched_at", dateFrom)
        .lte("watched_at", dateTo);

    if (error) {
        console.error("[analytics] getAnalyticsMetrics error:", error.message);
        return {
            total_watch_hours: 0,
            avg_watch_hours_per_student: 0,
            most_watched_course: "—",
            most_active_day: "—",
        };
    }

    const records = data ?? [];
    const totalMinutes = records.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    const uniqueStudents = new Set((records as any[]).map((r) => r.user_id)).size;
    const avgHours = uniqueStudents > 0 ? totalHours / uniqueStudents : 0;

    // Find most watched course
    const courseMap: Record<string, number> = {};
    (records as any[]).forEach((r) => {
        const course = r.lecture?.chapter?.course?.title || "Unknown";
        courseMap[course] = (courseMap[course] || 0) + (r.duration_minutes || 0);
    });
    const mostWatchedCourse = Object.entries(courseMap).sort(
        ([, a], [, b]) => b - a
    )[0]?.[0] || "—";

    // Find most active day
    const dayMap: Record<string, number> = {};
    (records as any[]).forEach((r) => {
        const day = new Date(r.watched_at).toLocaleDateString("en-IN");
        dayMap[day] = (dayMap[day] || 0) + (r.duration_minutes || 0);
    });
    const mostActiveDay = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";

    return {
        total_watch_hours: Math.round(totalHours * 10) / 10,
        avg_watch_hours_per_student: Math.round(avgHours * 10) / 10,
        most_watched_course: mostWatchedCourse,
        most_active_day: mostActiveDay,
    };
}
