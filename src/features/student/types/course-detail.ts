// ─────────────────────────────────────────────────────────
// Course Detail — TypeScript interfaces
// ─────────────────────────────────────────────────────────

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
}

export type LessonType = "video" | "reading" | "quiz" | "assignment";
export type LessonStatus = "completed" | "current" | "locked";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: LessonType;
  status: LessonStatus;
}

export interface Module {
  id: string;
  title: string;
  lessonsCount: number;
  duration: string;
  lessons: Lesson[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    stars: number;
    count: number;
    percentage: number;
  }[];
}

export interface RelatedCourse {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  duration: string;
  level: string;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  category: string;
  duration: string;
  language: string;
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  modulesCount: number;
  assignmentsCount: number;
  resourcesCount: number;
  progress: number;
  lastLesson: string;
  certificateStatus: "not_started" | "in_progress" | "earned";
  about: string;
  learningOutcomes: string[];
  courseIncludes: string[];
  accessInfo: string;
  instructor: Instructor;
  modules: Module[];
  reviewSummary: ReviewSummary;
  relatedCourses: RelatedCourse[];
}
