import { redirect } from "next/navigation";
import { createServerClient_ } from "@/lib/supabase/server";

type LegacyStreamSubpath = "control" | "edit" | "analytics" | "chat";

export async function redirectLegacyStreamRoute(
  streamId: string,
  subpath?: LegacyStreamSubpath,
) {
  const supabase = await createServerClient_();
  const { data } = await supabase
    .from("live_streams")
    .select("course_id")
    .eq("id", streamId)
    .maybeSingle();

  if (data?.course_id) {
    const base = `/admin/courses/${data.course_id}/live-streams/${streamId}`;
    redirect(subpath ? `${base}/${subpath}` : `${base}/control`);
  }

  redirect("/admin/courses");
}
