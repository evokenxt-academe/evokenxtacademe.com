/**
 * 🎓 Data Transformation Layer
 * Converts Supabase database models → UI models
 * Used by the course detail page to map DB data to component props
 */

import type {
    CourseWithCurriculum,
    Lecture,
    Section,
    Review,
} from "./types";
import type { CourseDetail } from "@/features/student/types/course-detail";

/**
 * Convert seconds to human-readable duration format
 * Examples: 3600 → "1h", 5400 → "1h 30m", 600 → "10m"
 */
export function formatDuration(seconds: number): string {
    if (seconds === 0) return "0m";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

/**
 * Calculate statistics about a course
 */
interface CourseStats {
    lessonsCount: number;
    modulesCount: number;
    resourcesCount: number;
    totalDuration: string;
}

function calculateStats(dbCourse: CourseWithCurriculum): CourseStats {
    let lessonsCount = 0;
    let resourcesCount = 0;
    let totalSeconds = 0;

    dbCourse.sections.forEach((section) => {
        lessonsCount += section.lectures.length;
        section.lectures.forEach((lecture) => {
            resourcesCount += lecture.resources.length;
            totalSeconds += lecture.duration_sec ?? 0;
        });
    });

    return {
        lessonsCount,
        modulesCount: dbCourse.sections.length,
        resourcesCount,
        totalDuration: formatDuration(totalSeconds),
    };
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Calculate rating distribution (for ReviewSummary component)
 */
function calculateRatingDistribution(reviews: Review[]) {
    if (reviews.length === 0) {
        return [
            { stars: 5, count: 0, percentage: 0 },
            { stars: 4, count: 0, percentage: 0 },
            { stars: 3, count: 0, percentage: 0 },
            { stars: 2, count: 0, percentage: 0 },
            { stars: 1, count: 0, percentage: 0 },
        ];
    }

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((r) => r.rating === stars).length;
        return {
            stars,
            count,
            percentage: Math.round((count / reviews.length) * 100),
        };
    });

    return distribution;
}

/**
 * Transform Supabase CourseWithCurriculum → UI CourseDetail
 *
 * Maps database fields to component properties:
 * - course.name → title
 * - course.description → about
 * - sections → modules
 * - lectures → lessons (with formatted duration)
 * - resources → attachments
 * - reviews → rating data
 */
export function transformCourseToUI(dbCourse: CourseWithCurriculum): CourseDetail {
    const stats = calculateStats(dbCourse);
    const reviews = dbCourse.reviews || [];
    const averageRating = calculateAverageRating(reviews);

    return {
        id: dbCourse.id,
        title: dbCourse.name,
        description: dbCourse.description || "",
        thumbnail: dbCourse.thumbnail_url || "/placeholder-course.jpg",
        level: dbCourse.level === "professional" ? "Professional" : "Foundation",
        category: "ACCA", // Could be derived from a category column if it existed
        duration: stats.totalDuration,
        language: "English", // Could be a database field
        rating: averageRating,
        studentsCount: 0, // TODO: Could count enrollments if available
        lessonsCount: stats.lessonsCount,
        modulesCount: stats.modulesCount,
        assignmentsCount: 0, // Would need to count specific quiz types
        resourcesCount: stats.resourcesCount,
        progress: 0, // Would come from user enrollment progress
        lastLesson: "", // Would come from user's lecture progress
        certificateStatus: "not_started", // Would come from user's completion status
        about:
            dbCourse.description ||
            "Professional course with structured curriculum and expert instruction.",
        learningOutcomes: [
            "Master the course material",
            "Apply concepts in practice",
            "Prepare for certification",
        ], // Could be stored in DB
        courseIncludes: [
            `${stats.lessonsCount} lessons across ${stats.modulesCount} modules`,
            `${stats.resourcesCount} downloadable resources`,
            "Certificate of completion",
            "Lifetime access",
        ],
        accessInfo: "Full lifetime access",
        instructor: dbCourse.instructor
            ? {
                id: dbCourse.instructor.id,
                name: dbCourse.instructor.name || "Instructor",
                avatar: dbCourse.instructor.avatar || "",
                title: "Expert Instructor", // Could be a DB field
                bio: "Professional instructor with extensive experience.", // Could be a DB field
                coursesCount: 1, // Would need to count from DB
                studentsCount: 0, // Would need to count enrollments
                rating: averageRating,
            }
            : {
                id: "",
                name: "Instructor",
                avatar: "",
                title: "Expert Instructor",
                bio: "Professional instructor",
                coursesCount: 0,
                studentsCount: 0,
                rating: 0,
            },
        modules: dbCourse.sections.map((section: Section) => ({
            id: section.id,
            title: section.title,
            lessonsCount: section.lectures.length,
            duration: formatDuration(
                section.lectures.reduce((sum, l) => sum + l.duration_sec, 0)
            ),
            lessons: section.lectures.map((lecture: Lecture) => ({
                id: lecture.id,
                title: lecture.title,
                duration: formatDuration(lecture.duration_sec),
                type: lecture.video_url ? "video" : "reading",
                status: "locked" as const, // Default to locked; would come from user progress
            })),
        })),
        reviewSummary: {
            averageRating,
            totalReviews: reviews.length,
            distribution: calculateRatingDistribution(reviews),
        },
        relatedCourses: [], // Would need to query similar courses
    };
}
