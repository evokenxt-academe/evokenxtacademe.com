import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import { normalizeQuiz } from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        quizzes: (data ?? []).map((row) => normalizeQuiz(row as Record<string, unknown>)),
    });
}