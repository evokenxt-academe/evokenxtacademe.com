import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { fetchMyCoursesV21 } from "./_lib/my-courses-data";
import { MyCoursesClient } from "./MyCoursesClient";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const rows = await fetchMyCoursesV21(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <MyCoursesClient rows={rows} />
    </div>
  );
}
