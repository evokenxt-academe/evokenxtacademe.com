import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ enrollmentId: string }> }
) {
    const auth = await requireAdmin(["admin"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { enrollmentId } = await params;

    const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
