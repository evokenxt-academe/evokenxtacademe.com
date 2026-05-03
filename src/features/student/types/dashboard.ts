// ─── Student Dashboard Types ───────────────────────────────────────
// Shared between server queries, API route, and client components.

/** Top-level stats shown as cards */
export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  averageScore: number; // 0–100 percentage
  totalLearningMinutes: number;
}

/** Per-course progress for the course list */
export interface CourseProgressItem {
  courseId: string;
  courseName: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  completedLectures: number;
  totalLectures: number;
  totalDurationSec: number;
  continueLectureId: string | null;
  continueLectureTitle: string | null;
  lastActivityAt: string | null;
}

/** Single day in the weekly activity chart */
export interface WeeklyActivityPoint {
  day: string; // e.g. "Mon", "Tue"
  date: string; // ISO date string
  minutes: number;
}

/** Single data point for quiz score timeline */
export interface QuizScorePoint {
  quizTitle: string;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
}

/** Activity feed item */
export interface ActivityFeedItem {
  id: string;
  type: "lecture" | "quiz" | "live_stream";
  title: string;
  subtitle: string; // course name or quiz name
  href: string;
  timestamp: string;
  meta?: string; // e.g. "Completed", "85%", "Passed"
  status?: "completed" | "in_progress" | "passed" | "failed";
}

/** Live stream entry */
export interface LiveStreamEntry {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  ytVideoId: string | null;
}

/** Aggregate quiz stats */
export interface QuizOverviewStats {
  published: number;
  attempted: number;
  passed: number;
}

/** Complete serializable dashboard payload (SSR → client) */
export interface DashboardPageData {
  profileName: string;
  stats: DashboardStats;
  courses: CourseProgressItem[];
  weeklyActivity: WeeklyActivityPoint[];
  quizScores: QuizScorePoint[];
  quizOverview: QuizOverviewStats;
  activityFeed: ActivityFeedItem[];
  liveStreams: LiveStreamEntry[];
  continueHref: string;
  enrolledCourseIds: string[];
}
