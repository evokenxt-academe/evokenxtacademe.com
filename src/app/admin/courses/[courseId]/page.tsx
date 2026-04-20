import { redirect } from "next/navigation";

import { createAdminClient } from "@/utils/supabase/adminClient";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

async function resolveCourseSlug(courseId: string) {
  const supabase = createAdminClient();
  const identifier = courseId.trim();
  const lookupColumns = isUuid(identifier) ? ["id", "slug"] : ["slug", "id"];

  for (const column of lookupColumns) {
    const result = await supabase
      .from("courses")
      .select("slug")
      .eq(column, identifier)
      .maybeSingle();

    if (result.error) {
      return { error: result.error.message } as const;
    }

    if (typeof result.data?.slug === "string" && result.data.slug.trim()) {
      return { slug: result.data.slug } as const;
    }
  }

  return { slug: null } as const;
}

export default async function EditCoursesAliasPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const courseResult = await resolveCourseSlug(courseId);

  if ("error" in courseResult || !courseResult.slug) {
    redirect("/admin/course");
  }

  redirect(`/admin/course/${courseResult.slug}`);
}
