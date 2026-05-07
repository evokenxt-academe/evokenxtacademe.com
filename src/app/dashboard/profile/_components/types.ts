export const examBodies = ["ACCA", "CFA", "CMA"] as const;

export const genderOptions = ["male", "female", "other", "prefer_not_to_say"] as const;

export const languageOptions = ["en", "hi", "mr"] as const;

export const profileTabKeys = ["personal", "academic", "exam", "location"] as const;

export const examLevelOptions = {
    ACCA: ["Applied Knowledge", "Applied Skills", "Strategic Professional"],
    CFA: ["Level I", "Level II", "Level III"],
    CMA: ["Part 1", "Part 2"],
} as const;

export type ExamBody = (typeof examBodies)[number];
export type Gender = (typeof genderOptions)[number];
export type PreferredLanguage = (typeof languageOptions)[number];
export type ProfileTabKey = (typeof profileTabKeys)[number];

export interface StudentProfileData {
    college_name: string | null;
    university: string | null;
    degree: string | null;
    graduation_year: number | null;
    field_of_study: string | null;
    current_employer: string | null;
    job_title: string | null;
    years_of_experience: number | null;
    target_exam_body: ExamBody | null;
    target_exam_level: string | null;
    target_exam_date: string | null;
    exam_attempt_number: number | null;
    city: string | null;
    state: string | null;
    country: string | null;
    linkedin_url: string | null;
    bio: string | null;
    date_of_birth: string | null;
    gender: Gender | null;
    preferred_language: PreferredLanguage | null;
    notification_email: boolean;
    notification_sms: boolean;
    notification_whatsapp: boolean;
}

export interface ProfileData {
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
        phone: string | null;
        role: string | null;
    };
    studentProfile: StudentProfileData | null;
}

export interface ProfileStats {
    totalWatchHours: number;
    coursesEnrolled: number;
    quizzesAttempted: number;
    certificates: number;
}

export function getInitials(name: string | null | undefined, email: string): string {
    const source = name?.trim() || email.trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "ST";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getExamLevelOptions(body: ExamBody | null | undefined): readonly string[] {
    if (!body) {
        return [];
    }

    return examLevelOptions[body];
}

export function formatExamHeaderLabel(
    body: ExamBody | null | undefined,
    level: string | null | undefined,
): string | null {
    if (!body || !level) {
        return null;
    }

    const shorthandMap: Record<string, string> = {
        "Applied Knowledge": "Level I",
        "Applied Skills": "Level II",
        "Strategic Professional": "Level III",
    };

    const shorthand = shorthandMap[level];

    if (body === "ACCA" && shorthand) {
        return `${body} · ${level} · ${shorthand}`;
    }

    return `${body} · ${level}`;
}

export function formatLocationLine(
    city: string | null | undefined,
    country: string | null | undefined,
): string | null {
    const parts = [city?.trim(), country?.trim()].filter(Boolean);

    if (!parts.length) {
        return null;
    }

    return parts.join(", ");
}

export function formatCountryValue(country: string | null | undefined): string {
    return country?.trim() || "India";
}