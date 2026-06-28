import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
);

const ADMIN_EMAIL = process.env.YOUTUBE_ADMIN_EMAIL || 'amarbiradar147@gmail.com';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
      return auth.error;
    }

    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users?.users?.find((u) => u.email === ADMIN_EMAIL);
    if (!adminUser) {
      return NextResponse.json({ connected: false, message: "Admin user not found" });
    }

    const { data: token, error } = await supabase
      .from('youtube_tokens')
      .select('scopes, expires_at')
      .eq('user_id', adminUser.id)
      .single();

    if (error || !token) {
      return NextResponse.json({ connected: false });
    }

    const scopes = token.scopes || '';
    const hasDriveScope = scopes.includes('drive.readonly');
    const isExpired = new Date(token.expires_at || 0) < new Date();

    return NextResponse.json({
      connected: true,
      hasDriveScope,
      isExpired,
      scopes,
    });
  } catch (err: any) {
    console.error("Google Drive status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
