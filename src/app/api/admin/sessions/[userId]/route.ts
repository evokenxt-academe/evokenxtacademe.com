import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(["admin"]);
  if ("error" in auth) {
    return auth.error;
  }

  const { supabase } = auth;
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({
      current_session_id: null,
      session_last_seen_at: null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Session terminated successfully",
  });
}
