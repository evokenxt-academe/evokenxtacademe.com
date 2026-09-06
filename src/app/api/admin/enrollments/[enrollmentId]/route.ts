import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ enrollmentId: string }> }
) {
    const auth = await requireAdmin(["admin"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;
    const { enrollmentId } = await params;

    let body: {
        expiresAt?: string | null;
        status?: "active" | "expired" | "refunded";
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 },
        );
    }

    const updatePayload: Record<string, unknown> = {};

    if (body.status !== undefined) {
        const validStatuses = ["active", "expired", "refunded"];
        if (!validStatuses.includes(body.status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 },
            );
        }
        updatePayload.status = body.status;
    }

    if ("expiresAt" in body) {
        if (body.expiresAt === null) {
            updatePayload.expires_at = null;
        } else if (typeof body.expiresAt === "string") {
            const expiryDate = new Date(body.expiresAt);
            if (Number.isNaN(expiryDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid expiry date format" },
                    { status: 400 },
                );
            }
            updatePayload.expires_at = expiryDate.toISOString();
        }
    }

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json(
            { error: "No valid fields to update" },
            { status: 400 },
        );
    }

    const { error } = await supabase
        .from("enrollments")
        .update(updatePayload)
        .eq("id", enrollmentId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

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
