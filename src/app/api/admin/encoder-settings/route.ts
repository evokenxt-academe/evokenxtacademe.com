import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

const DEFAULTS = {
  obs_host: "localhost",
  obs_port: 4455,
  obs_password: "",
  notes: "",
};

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("stream_encoder_settings")
    .select("obs_host, obs_port, obs_password, notes, updated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  // Table missing or other DB error — return defaults so Go Live still works
  if (error) {
    console.warn("encoder-settings GET:", error.message);
    return NextResponse.json({
      settings: DEFAULTS,
      source: "defaults",
      warning: error.message.includes("does not exist")
        ? "Run supabase-migration-encoder-settings.sql to persist settings"
        : undefined,
    });
  }

  if (data) {
    return NextResponse.json({ settings: data, source: "database" });
  }

  // No row yet — auto-create defaults for this admin
  const { data: created, error: insertError } = await auth.supabase
    .from("stream_encoder_settings")
    .upsert(
      { user_id: auth.userId, ...DEFAULTS },
      { onConflict: "user_id" },
    )
    .select("obs_host, obs_port, obs_password, notes, updated_at")
    .single();

  if (insertError) {
    console.warn("encoder-settings auto-create:", insertError.message);
    return NextResponse.json({ settings: DEFAULTS, source: "defaults" });
  }

  return NextResponse.json({ settings: created, source: "database" });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const obs_host = (body.obs_host as string)?.trim() || "localhost";
  const obs_port = Number(body.obs_port) || 4455;
  const obs_password = (body.obs_password as string) ?? "";
  const notes = (body.notes as string) ?? "";

  const { data, error } = await auth.supabase
    .from("stream_encoder_settings")
    .upsert(
      {
        user_id: auth.userId,
        obs_host,
        obs_port,
        obs_password,
        notes,
      },
      { onConflict: "user_id" },
    )
    .select("obs_host, obs_port, obs_password, notes, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
