import type { DashboardData } from "./dashboard-data";
import { computeDaysToExam, computeStreak } from "./dashboard-data";
import type { DashboardViewModel } from "@/types/dashboard";
import type { ProgramBody } from "@/types/supabase";

function dayLabel(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function toYmdLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeLongestStreak(streakDays: { watch_date: string; total_seconds: number }[]): number {
  let longest = 0;
  let current = 0;
  for (const day of streakDays) {
    if (day.total_seconds > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function buildDashboardViewModel(data: DashboardData): DashboardViewModel {
  const today = new Date();
  const watch7ByDay = (() => {
    const map = new Map<string, number>();
    for (const row of data.watchHours7d) {
      map.set(row.watch_date, (map.get(row.watch_date) ?? 0) + (row.total_seconds ?? 0));
    }
    const points: Array<{ dayLabel: string; date: string; hours: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = toYmdLocal(d);
      const seconds = map.get(dateKey) ?? 0;
      points.push({
        dayLabel: dayLabel(dateKey),
        date: dateKey,
        hours: Math.round((seconds / 3600) * 10) / 10,
      });
    }
    return points;
  })();

  const watch7Total = Math.round(watch7ByDay.reduce((sum, p) => sum + p.hours, 0) * 10) / 10;
  const watch7Average = Math.round((watch7Total / 7) * 10) / 10;
  const watchTrend =
    watch7ByDay.length >= 2 ? watch7ByDay[watch7ByDay.length - 1].hours - watch7ByDay[0].hours : 0;
  const watchTrendPct = watch7ByDay[0]?.hours
    ? Math.round((watchTrend / watch7ByDay[0].hours) * 100)
    : 0;

  const totalWatchHours =
    Math.round((data.streakDays.reduce((s, d) => s + d.total_seconds, 0) / 3600) * 10) / 10;
  const quizzesPassed = data.recentAttempts.filter((a) => a.passed).length;
  const currentStreak = computeStreak(data.streakDays);
  const longestStreak = computeLongestStreak(data.streakDays);
  const totalActiveDays = data.streakDays.filter((d) => d.total_seconds > 0).length;

  const courseProgress = data.activeEnrollments.map((c) => {
    const total = c.total_lectures || 0;
    const pct = total > 0 ? Math.round((c.completed_lectures / total) * 100) : 0;
    return {
      title: c.title,
      completed: c.completed_lectures,
      remaining: Math.max(0, total - c.completed_lectures),
      pct,
      courseId: c.course_id,
      slug: c.slug,
    };
  });

  const totalCompleted = courseProgress.reduce((s, d) => s + d.completed, 0);
  const totalRemaining = courseProgress.reduce((s, d) => s + d.remaining, 0);
  const overallProgressPct =
    totalCompleted + totalRemaining > 0
      ? Math.round((totalCompleted / (totalCompleted + totalRemaining)) * 100)
      : 0;

  const activeCourses = data.activeEnrollments.map((c) => {
    const total = c.total_lectures || 0;
    const pct = total > 0 ? Math.round((c.completed_lectures / total) * 100) : 0;
    return {
      enrollmentId: c.enrollment_id,
      courseId: c.course_id,
      title: c.title,
      slug: c.slug,
      subtitle: `${c.subject_name} · ${c.level_label}`,
      thumbnailUrl: c.thumbnail_url,
      category: c.program_body.toUpperCase(),
      subjectCode: c.subject_code,
      programBody: c.program_body as ProgramBody,
      rating: c.avg_rating,
      completedLectures: c.completed_lectures,
      totalLectures: total,
      progressPct: pct,
      lastActivity: c.last_activity,
      isLocked: pct === 0 && c.completed_lectures === 0,
    };
  });

  const resume = data.resume.map((r) => {
    const enrollment = data.activeEnrollments.find((e) => e.course_id === r.course_id);
    const total = enrollment?.total_lectures ?? 0;
    const completed = enrollment?.completed_lectures ?? 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      enrollmentId: enrollment?.enrollment_id ?? r.course_id,
      courseId: r.course_id,
      title: r.course_title,
      slug: r.course_slug,
      subtitle: r.chapter_title,
      thumbnailUrl: r.thumbnail_url,
      category: enrollment?.program_body.toUpperCase() ?? "COURSE",
      subjectCode: enrollment?.subject_code ?? "",
      programBody: (enrollment?.program_body ?? "acca") as ProgramBody,
      completedLectures: completed,
      totalLectures: total,
      progressPct: pct,
      lastActivity: r.last_watched_at,
      lectureId: r.lecture_id,
      lectureTitle: r.lecture_title,
      chapterTitle: r.chapter_title,
      resumeAtSeconds: r.resume_at_seconds,
      durationSec: r.duration_sec,
      lastWatchedAt: r.last_watched_at,
      isLocked: false,
    };
  });

  const searchItems = [
    ...data.activeEnrollments.map((c) => ({
      id: `course-${c.course_id}`,
      title: c.title,
      subtitle: c.subject_name,
      href: `/learn/${c.slug}`,
      type: "course" as const,
    })),
    ...data.recentAttempts.slice(0, 5).map((a) => ({
      id: `quiz-${a.quiz_id}`,
      title: a.quiz_title,
      subtitle: a.course_title,
      href: `/dashboard/tests/${a.quiz_id}`,
      type: "quiz" as const,
    })),
    ...data.liveStreams.map((s) => ({
      id: `live-${s.id}`,
      title: s.title,
      subtitle: s.course_title,
      href: `/learn/${s.course_slug}/live`,
      type: "live" as const,
    })),
  ];

  return {
    profile: {
      name: data.profile.name,
      avatar: data.profile.avatar,
      email: data.profile.email,
      role: "Student",
      targetExamBody: data.profile.target_exam_body,
      targetExamLevel: data.profile.target_exam_level,
      daysToExam: computeDaysToExam(data.profile.target_exam_date),
    },
    stats: {
      watchHours: totalWatchHours,
      watchHoursChangePct: watchTrendPct,
      coursesEnrolled: data.activeEnrollments.length,
      coursesChangePct: 0,
      quizzesPassed,
      quizzesPassedChangePct: 0,
      certificates: data.certificates.length,
      certificatesChangePct: 0,
    },
    resume,
    activeCourses,
    watchHours7d: watch7ByDay,
    watch7Total,
    watch7Average,
    watchTrendPct,
    quizPerformance: data.recentAttempts.slice(0, 8).map((a) => ({
      quizTitle: a.quiz_title,
      percentage: a.percentage,
      passed: a.passed,
    })),
    courseProgress,
    overallProgressPct,
    streakDays: data.streakDays.map((d) => ({
      date: d.watch_date,
      seconds: d.total_seconds,
      lecturesWatched: d.total_seconds > 0 ? Math.max(1, Math.round(d.total_seconds / 1200)) : 0,
    })),
    currentStreak,
    longestStreak,
    totalActiveDays,
    liveSessions: data.liveStreams.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status,
      scheduledAt: s.scheduled_at,
      startedAt: s.started_at,
      courseTitle: s.course_title,
      courseId: s.course_id,
      courseSlug: s.course_slug,
      instructorName: s.instructor_name,
      instructorAvatar: s.instructor_avatar,
    })),
    certificates: data.certificates.map((c) => ({
      id: c.id,
      certNumber: c.cert_number,
      certUrl: c.cert_url,
      courseTitle: c.course_title,
      subjectName: c.subject_name,
      programBody: c.program_body,
      issuedAt: c.issued_at,
      completionPct: c.completion_pct,
    })),
    quizResults: data.recentAttempts.map((a) => ({
      attemptId: a.attempt_id,
      quizId: a.quiz_id,
      quizTitle: a.quiz_title,
      quizType: a.quiz_type,
      courseTitle: a.course_title,
      courseId: a.course_id,
      score: a.score,
      totalMarks: a.total_marks,
      percentage: a.percentage,
      passed: a.passed,
      submittedAt: a.submitted_at,
    })),
    searchItems,
  };
}
