import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  console.log("chapters:");
  console.log(await supabase
    .from("chapters")
    .select(
      `id, title, position, is_published,
       lectures(
         id, title, duration_sec, position, is_preview, is_published, yt_video_id
       )`
    )
    .eq("course_id", "68ffccc4-4af5-4851-8022-d8f40eea7014")
    .order("position", { ascending: true }));
}
test();
