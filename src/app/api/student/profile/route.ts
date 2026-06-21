import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.v2.types";

export async function PUT(request: NextRequest) {
  // 1. Verify authenticated user
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();

  // 3. Create service role client to bypass RLS and handle upserts/updates
  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );

  // 4. Update public.users table if name or phone is passed
  const userUpdates: Record<string, any> = {};
  if (body.name !== undefined) userUpdates.name = body.name?.trim() || "";
  if (body.phone !== undefined) userUpdates.phone = body.phone?.trim() || null;
  if (body.avatar !== undefined) userUpdates.avatar = body.avatar || null;

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await (supabaseAdmin as any)
      .from("users")
      .update(userUpdates)
      .eq("id", user.id);

    if (userError) {
      console.error("[api_profile] user update error:", userError.message);
      return NextResponse.json({ error: "Failed to update account details" }, { status: 500 });
    }
  }

  // 5. Update/Upsert public.student_profiles table
  // We extract any student_profile fields present in the body
  const profileUpdates: Record<string, any> = {
    user_id: user.id,
  };

  const profileFields = [
    "college_name", "university", "degree", "graduation_year", "field_of_study",
    "current_employer", "job_title", "years_of_experience",
    "target_exam_body", "target_exam_level", "target_exam_date", "exam_attempt_number",
    "city", "state", "country", "linkedin_url", "bio", "date_of_birth", "gender",
    "preferred_language", "notification_email", "notification_sms", "notification_whatsapp"
  ];

  let hasProfileUpdates = false;
  for (const field of profileFields) {
    if (body[field] !== undefined) {
      profileUpdates[field] = body[field];
      hasProfileUpdates = true;
    }
  }

  if (hasProfileUpdates) {
    // Use upsert to handle cases where the profile row does not exist yet!
    const { error: profileError } = await (supabaseAdmin as any)
      .from("student_profiles")
      .upsert(profileUpdates, { onConflict: "user_id" });

    if (profileError) {
      console.error("[api_profile] student_profile upsert error:", profileError.message);
      return NextResponse.json({ error: "Failed to update profile details" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
