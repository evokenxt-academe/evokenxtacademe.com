import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { SESSION_STALE_MS } from "@/lib/auth/single-session";

export async function GET() {
  const auth = await requireAdmin(["admin", "instructor"]);
  if ("error" in auth) {
    return auth.error;
  }

  const { supabase } = auth;

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, avatar, role, current_session_id, session_last_seen_at, created_at"
    )
    .order("session_last_seen_at", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();

  // Only manage students (exclude admin and instructor roles)
  const filteredUsers = (data ?? []).filter(
    (user) => user.role !== "admin" && user.role !== "instructor"
  );

  const sessions = filteredUsers.map((user) => {
    let status: "active" | "idle" | "offline" = "offline";

    if (user.current_session_id && user.session_last_seen_at) {
      const lastSeen = new Date(user.session_last_seen_at).getTime();
      const elapsed = now - lastSeen;

      if (elapsed < SESSION_STALE_MS) {
        // Within heartbeat window → active
        status = elapsed < 2 * 60 * 1000 ? "active" : "idle";
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role ?? "student",
      hasSession: !!user.current_session_id,
      sessionLastSeenAt: user.session_last_seen_at,
      status,
      createdAt: user.created_at,
    };
  });

  return NextResponse.json({ sessions });
}
