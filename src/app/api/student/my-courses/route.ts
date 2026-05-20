import { createClient } from "@/utils/supabase/server";
import { fetchMyCoursesV21 } from "@/app/dashboard/my-courses/_lib/my-courses-data";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchMyCoursesV21(supabase, user.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/student/my-courses] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}
