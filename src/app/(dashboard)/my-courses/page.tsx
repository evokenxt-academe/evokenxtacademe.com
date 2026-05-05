import { redirect } from "next/navigation";

export default function Page() {
  // Legacy route: the new schema uses courses → chapters (not sections).
  // Redirect to the rewritten student route.
  redirect("/dashboard/my-courses");
}
