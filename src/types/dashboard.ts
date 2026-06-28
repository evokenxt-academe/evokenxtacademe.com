import type { ProgramBody } from "@/types/supabase";

export interface StudentStats {
  watchHours: number;
  watchHoursChangePct: number;
  coursesEnrolled: number;
  coursesChangePct: number;
  quizzesPassed: number;
  quizzesPassedChangePct: number;
  certificates: number;
  certificatesChangePct: number;
}

export interface CourseCard {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  subtitle: string;
  thumbnailUrl: string | null;
  category: string;
  subjectCode: string;
  programBody: ProgramBody;
  instructorName?: string;
  instructorAvatar?: string | null;
  rating?: number | null;
  description?: string;
  completedLectures: number;
  totalLectures: number;
  progressPct: number;
  lastActivity: string | null;
  isLocked?: boolean;
}

export interface ResumeCourseCard extends CourseCard {
  lectureId: string;
  lectureTitle: string;
  chapterTitle: string;
  resumeAtSeconds: number;
  durationSec: number;
  lastWatchedAt: string;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizType: string;
  courseTitle: string;
  courseId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: "scheduled" | "live";
  scheduledAt: string | null;
  startedAt: string | null;
  durationMinutes?: number | null;
  courseTitle: string;
  courseId: string;
  courseSlug: string;
  instructorName: string;
  instructorAvatar: string | null;
}

export interface Certificate {
  id: string;
  certNumber: string;
  certUrl: string;
  courseTitle: string;
  subjectName: string;
  programBody: ProgramBody;
  issuedAt: string;
  completionPct: number | null;
}

export interface WatchHourData {
  dayLabel: string;
  date: string;
  hours: number;
}

export interface QuizPerformanceData {
  quizTitle: string;
  percentage: number;
  passed: boolean;
}

export interface StreakData {
  date: string;
  seconds: number;
  lecturesWatched: number;
}

export interface CourseProgressItem {
  title: string;
  completed: number;
  remaining: number;
  pct: number;
  courseId: string;
  slug: string;
}

export interface DashboardViewModel {
  profile: {
    name: string;
    avatar: string | null;
    email: string;
    role: string;
    targetExamBody: ProgramBody | null;
    targetExamLevel: string | null;
    daysToExam: number | null;
  };
  stats: StudentStats;
  resume: ResumeCourseCard[];
  activeCourses: CourseCard[];
  watchHours7d: WatchHourData[];
  watch7Total: number;
  watch7Average: number;
  watchTrendPct: number;
  quizPerformance: QuizPerformanceData[];
  courseProgress: CourseProgressItem[];
  overallProgressPct: number;
  streakDays: StreakData[];
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  liveSessions: LiveSession[];
  certificates: Certificate[];
  quizResults: QuizResult[];
  searchItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
    type: "course" | "quiz" | "live";
  }>;
}
