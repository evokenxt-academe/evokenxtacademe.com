import { createClient } from "@/utils/supabase/server";
import { fetchDashboardPageData } from "@/features/student/lib/dashboard-queries";
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
    const data = await fetchDashboardPageData(supabase, user.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/student/dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
