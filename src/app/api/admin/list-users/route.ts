import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import { normalizeUser } from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: (data ?? []).map((row) => normalizeUser(row as Record<string, unknown>)) });
}
