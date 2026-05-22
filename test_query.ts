import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  console.log("courses:");
  console.log(await supabase.from("courses").select("*").limit(1));
  console.log("course query:");
  console.log(await supabase
    .from("courses")
    .select(
      `id, title, slug, description, short_description,
       what_you_learn, requirements, thumbnail_url, preview_video_url,
       language, status, is_featured, avg_rating, total_students,
       subject:subjects!inner(
         name, code,
         program_level:program_levels!inner(
           label,
           program:programs!inner(body)
         )
       ),
       instructor:users!instructor_id(name, avatar),
       pricing:course_pricing(base_price, discounted_price, currency, label, is_active)`
    )
    .eq("slug", "business-and-technology")
    .eq("status", "published")
    .maybeSingle());
}
test();
