import type {
    AdminChatMessage,
    AdminCourse,
    AdminEnrollment,
    AdminLiveStream,
    AdminPayment,
    AdminQuiz,
    AdminReview,
    AdminUser,
} from "@/features/admin/data/admin-sample-data";
import type { AdminCoursePreview } from "@/features/admin/course/types/course-preview";

export type AdminDashboardApiResponse = {
    stats: Array<{
        label: string;
        value: string;
        delta: string;
    }>;
    revenueSeries: Array<{ month: string; revenue: number }>;
    growthSeries: Array<{ month: string; users: number }>;
    recentActivity: Array<{
        id: string;
        title: string;
        description: string;
        time: string;
        tone: string;
    }>;
    operationsSnapshot: Array<{ label: string; value: string; note: string }>;
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        credentials: "include",
        cache: "no-store",
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
        throw new Error(payload?.error || `Request failed (${response.status})`);
    }

    return response.json() as Promise<T>;
}

export const adminApi = {
    getDashboard: () =>
        adminFetch<AdminDashboardApiResponse>("/api/admin/dashboard"),
    getUsers: () => adminFetch<{ users: AdminUser[] }>("/api/admin/list-users"),
    updateUserRole: (userId: string, role: string) =>
        adminFetch<{ success: boolean; role: string }>(`/api/admin/users/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        }),
    getCourses: () => adminFetch<{ courses: AdminCourse[] }>("/api/admin/courses"),
    getCoursePreview: (courseId: string) =>
        adminFetch<{ course: AdminCoursePreview }>(`/api/admin/courses/${courseId}`),
    updateCourse: (
        courseId: string,
        payload: {
            name: string;
            slug: string;
            description: string;
            level: string;
            thumbnailUrl: string;
            instructorId: string;
            price: number;
            discountPrice: number | null;
            status: string;
            sections: Array<{
                title: string;
                position: number;
                lectures: Array<{
                    title: string;
                    videoUrl: string;
                    description: string;
                    durationSec: number;
                    position: number;
                    isPreview: boolean;
                    resources: Array<{
                        title: string;
                        fileUrl: string;
                    }>;
                }>;
            }>;
        },
    ) =>
        adminFetch<{ success: boolean; courseId: string }>(
            `/api/admin/courses/${courseId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload),
            },
        ),
    updateCourseStatus: (
        courseId: string,
        status: AdminCourse["status"],
    ) =>
        adminFetch<{ success: boolean; courseId: string }>(
            `/api/admin/courses/${courseId}`,
            {
                method: "PATCH",
                body: JSON.stringify({ status }),
            },
        ),
    deleteCourse: (courseId: string) =>
        adminFetch<{ success: boolean }>(`/api/admin/courses/${courseId}`, {
            method: "DELETE",
        }),
    getPayments: () =>
        adminFetch<{ payments: AdminPayment[] }>("/api/admin/payments"),
    getEnrollments: () =>
        adminFetch<{ 
            enrollments: AdminEnrollment[];
            users: AdminUser[];
            courses: AdminCourse[];
        }>("/api/admin/enrollments"),
    createEnrollment: (payload: { email: string; courseId: string; expiresAt?: string }) =>
        adminFetch<{ success: boolean }>("/api/admin/enrollments", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    revokeEnrollment: (enrollmentId: string) =>
        adminFetch<{ success: boolean }>(`/api/admin/enrollments/${enrollmentId}`, {
            method: "DELETE",
        }),
    getReviews: () => adminFetch<{ reviews: AdminReview[] }>("/api/admin/reviews"),
    getLiveStreams: () =>
        adminFetch<{ liveStreams: AdminLiveStream[] }>("/api/admin/live-streams"),
    getLiveChat: () =>
        adminFetch<{ chatMessages: AdminChatMessage[] }>("/api/admin/live-chat"),
    getQuizzes: () => adminFetch<{ quizzes: AdminQuiz[] }>("/api/admin/quizzes"),
};