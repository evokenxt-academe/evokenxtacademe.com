import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function POST(request: Request) {
  const auth = await requireAdmin(["admin"]);
  if ("error" in auth) {
    return auth.error;
  }

  const { supabase } = auth;

  let body: { userIds?: string[]; scope?: "all_students" | "selected" };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userIds, scope } = body;

  let query = supabase
    .from("users")
    .update({
      current_session_id: null,
      session_last_seen_at: null,
    });

  if (scope === "all_students") {
    // Terminate all student sessions (exclude admins and instructors)
    query = query.eq("role", "student");
  } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    query = query.in("id", userIds);
  } else {
    return NextResponse.json(
      { error: "Provide either userIds or scope: 'all_students'" },
      { status: 400 }
    );
  }

  // Only terminate users who actually have sessions
  query = query.not("current_session_id", "is", null);

  const { error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Terminated ${count ?? 0} session(s)`,
    terminated: count ?? 0,
  });
}
