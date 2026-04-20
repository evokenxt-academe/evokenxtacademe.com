import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"]);
        if ("error" in auth) {
            return auth.error;
        }

        const supabase = await createClient();
        
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: "No token provided" }, { status: 400 });
        }

        const { error } = await supabase.auth.updateUser({
            data: {
                youtube_refresh_token: token.trim()
            }
        });

        if (error) {
            console.error("Failed to update user_metadata with YouTube token:", error);
            return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
