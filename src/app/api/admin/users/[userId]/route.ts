import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const auth = await requireAdmin(["admin"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { userId } = await params;

    try {
        const { role } = await request.json();

        if (!role || !["student", "instructor"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const { error } = await supabase
            .from("users")
            .update({ role })
            .eq("id", userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, role });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
