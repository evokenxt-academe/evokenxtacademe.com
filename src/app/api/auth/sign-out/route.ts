import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";
import { LMS_HEARTBEAT_COOKIE, LMS_SESSION_COOKIE } from "@/lib/auth/single-session";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const adminClient = createAdminClient();
      await adminClient
        .from("users")
        .update({
          current_session_id: null,
          session_last_seen_at: null,
        })
        .eq("id", user.id);
    } catch (err) {
      console.error("Failed to clear session record on sign-out:", err);
    }
  }

  await supabase.auth.signOut({ scope: "local" });

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(LMS_SESSION_COOKIE);
  response.cookies.delete(LMS_HEARTBEAT_COOKIE);
  return response;
}
