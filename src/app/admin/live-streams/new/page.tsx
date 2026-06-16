import { redirect } from "next/navigation";

export default function LegacyNewStreamPage() {
  redirect("/admin/courses");
}
