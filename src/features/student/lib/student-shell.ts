import type { SupabaseClient } from "@supabase/supabase-js";

import type { StudentProfile } from "./lms-data";

type StudentProfileRow = {
    id: string | null;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string | null;
};

export async function fetchStudentShellProfile(
    supabase: SupabaseClient,
    userId: string,
): Promise<StudentProfile | null> {
    const { data, error } = await supabase
        .from("users")
        .select("id, name, email, avatar, role")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error(
            `[student-shell] fetch profile: ${error.message ?? "Unknown error"}`,
        );
    }

    const record = data as StudentProfileRow | null;

    if (!record?.id || !record.email) {
        return null;
    }

    return {
        id: record.id,
        name: record.name,
        email: record.email,
        avatar: record.avatar,
        role: record.role,
    };
}