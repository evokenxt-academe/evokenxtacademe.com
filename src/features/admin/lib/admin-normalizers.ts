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

type Row = Record<string, unknown>;

const pickString = (row: Row, keys: string[], fallback = "") => {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return fallback;
};

const pickNumber = (row: Row, keys: string[], fallback = 0) => {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim()) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return fallback;
};

const pickBoolean = (row: Row, keys: string[], fallback = false) => {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "boolean") {
            return value;
        }
    }

    return fallback;
};

const pickDate = (row: Row, keys: string[], fallback = new Date().toISOString()) => {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return fallback;
};

export const createLookupMap = <T extends { id: string | number }>(
    rows: T[] = [],
) => new Map(rows.map((row) => [String(row.id), row]));

export function normalizeUser(row: Row): AdminUser {
    return {
        id: pickString(row, ["id", "user_id", "uid"], ""),
        name: pickString(row, ["name", "full_name", "display_name"], "Unknown user"),
        email: pickString(row, ["email"], ""),
        avatar: pickString(row, ["avatar", "avatar_url", "profile_image_url"], ""),
        role: pickString(row, ["role"], "student") as AdminUser["role"],
        createdAt: pickDate(row, ["createdAt", "created_at", "inserted_at"]),
    };
}

export function normalizeCourse(
    row: Row,
    instructorName = "Unknown instructor",
): AdminCourse {
    return {
        id: pickString(row, ["id", "course_id"], ""),
        slug: pickString(row, ["slug", "course_slug"], ""),
        name: pickString(row, ["name", "title"], "Untitled course"),
        instructor: pickString(
            row,
            ["instructor_name", "instructor", "teacher_name"],
            instructorName,
        ),
        price: pickNumber(row, ["price", "amount", "list_price"], 0),
        status: pickString(row, ["status"], "draft") as AdminCourse["status"],
        createdAt: pickDate(row, ["createdAt", "created_at", "inserted_at"]),
    };
}

export function normalizePayment(
    row: Row,
    userName = "Unknown user",
    courseName = "Unknown course",
): AdminPayment {
    return {
        id: pickNumber(row, ["id", "payment_id"], 0),
        user: pickString(row, ["user_name", "user", "customer_name"], userName),
        course: pickString(row, ["course_name", "course", "product_name"], courseName),
        amount: pickNumber(row, ["amount", "total", "paid_amount"], 0),
        status: pickString(row, ["status"], "pending") as AdminPayment["status"],
        gateway: pickString(row, ["gateway", "provider", "payment_gateway"], "unknown"),
        createdAt: pickDate(row, ["createdAt", "created_at", "inserted_at"]),
    };
}

export function normalizeEnrollment(
    row: Row,
    userName = "Unknown user",
    courseName = "Unknown course",
): AdminEnrollment {
    return {
        id: pickString(row, ["id", "enrollment_id"], ""),
        userId: pickString(row, ["user_id", "userId"], ""),
        courseId: pickString(row, ["course_id", "courseId"], ""),
        user: pickString(row, ["user_name", "user"], userName),
        course: pickString(row, ["course_name", "course"], courseName),
        status: pickString(row, ["status"], "active") as AdminEnrollment["status"],
        enrolledAt: pickDate(row, ["enrolledAt", "enrolled_at", "created_at"]),
        expiresAt: pickDate(row, ["expiresAt", "expires_at", "valid_until"]),
    };
}

export function normalizeReview(
    row: Row,
    userName = "Unknown user",
    courseName = "Unknown course",
): AdminReview {
    return {
        id: pickNumber(row, ["id", "review_id"], 0),
        user: pickString(row, ["user_name", "user"], userName),
        course: pickString(row, ["course_name", "course"], courseName),
        rating: pickNumber(row, ["rating"], 0),
        comment: pickString(row, ["comment", "message", "body"], ""),
        createdAt: pickDate(row, ["createdAt", "created_at", "inserted_at"]),
    };
}

export function normalizeLiveStream(
    row: Row,
    courseName = "Unknown course",
): AdminLiveStream {
    return {
        id: pickNumber(row, ["id", "stream_id"], 0),
        title: pickString(row, ["title", "name"], "Untitled stream"),
        course: pickString(row, ["course_name", "course"], courseName),
        status: pickString(row, ["status"], "scheduled") as AdminLiveStream["status"],
        scheduledAt: pickDate(row, ["scheduledAt", "scheduled_at", "starts_at"]),
    };
}

export function normalizeChatMessage(
    row: Row,
    streamName = "Unknown stream",
    userName = "Unknown user",
): AdminChatMessage {
    return {
        id: pickNumber(row, ["id", "message_id"], 0),
        stream: pickString(row, ["stream_title", "stream"], streamName),
        user: pickString(row, ["user_name", "user"], userName),
        message: pickString(row, ["message", "body", "content"], ""),
        createdAt: pickDate(row, ["createdAt", "created_at", "inserted_at"]),
    };
}

export function normalizeQuiz(row: Row): AdminQuiz {
    return {
        id: pickNumber(row, ["id", "quiz_id"], 0),
        title: pickString(row, ["title", "name"], "Untitled quiz"),
        section: pickString(row, ["section", "module", "chapter"], "General"),
        type: pickString(row, ["type"], "practice") as AdminQuiz["type"],
        totalMarks: pickNumber(row, ["totalMarks", "total_marks"], 0),
        passingMarks: pickNumber(row, ["passingMarks", "passing_marks"], 0),
        published: pickBoolean(row, ["published"], false),
    };
}

export function computeMonthlySeries<T extends { createdAt: string }>(
    rows: T[],
    valueSelector: (row: T) => number,
    months = 6,
) {
    const now = new Date();
    const monthKeys = Array.from({ length: months }, (_, index) => {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index), 1));
        return {
            key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
            label: date.toLocaleString("en-US", { month: "short" }),
        };
    });

    const buckets = new Map(monthKeys.map((entry) => [entry.key, 0]));

    for (const row of rows) {
        const date = new Date(row.createdAt);
        if (Number.isNaN(date.getTime())) {
            continue;
        }

        const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
        if (buckets.has(key)) {
            buckets.set(key, (buckets.get(key) ?? 0) + valueSelector(row));
        }
    }

    return monthKeys.map((entry) => ({
        month: entry.label,
        value: buckets.get(entry.key) ?? 0,
    }));
}