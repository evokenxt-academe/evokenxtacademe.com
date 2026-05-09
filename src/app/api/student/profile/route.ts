import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
  };

  const updates: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    updates.phone = body.phone.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const { error } = await (supabase as any)
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error(`[profile] update: ${error.message}`);
    return NextResponse.json(
      { error: "Could not update profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
