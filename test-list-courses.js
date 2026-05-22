import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      status,
      subject:subjects(
        id,
        name,
        code,
        program_level:program_levels(
          id,
          label,
          program:programs(
            id,
            full_name,
            body
          )
        )
      )
    `);

  if (error) {
    console.error("Error fetching courses:", error);
  } else {
    console.log("All Courses in Database:\n", JSON.stringify(data, null, 2));
  }
}

run();
