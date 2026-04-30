import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const courseId = "0571a0ba-3874-4987-b940-1a1678dd394e";
  
  const { data, error } = await supabase
    .from("courses")
    .update({ status: "published" })
    .eq("id", courseId)
    .select();

  if (error) {
    console.error("Error updating course:", error);
  } else {
    console.log("Course published successfully:", data);
  }
}

run();
