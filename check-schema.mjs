import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envLocal = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

for (const line of envLocal.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim();
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=")) {
    supabaseKey = line.split("=")[1].trim(); // Using service role key to bypass RLS!
  }
}
if(!supabaseKey) { // fallback
for (const line of envLocal.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    supabaseKey = line.split("=")[1].trim(); 
  }
}
}


const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from("questions").insert([
    {
      quiz_id: "93e783b0-71f3-4bda-8d7d-dc9b3907e9f1",
      type: "mcq",
      question_text: "test",
      marks: 1,
      negative_marks: 0,
      is_mandatory: true,
      blank_placeholder: "test",
      assertion_text: "test",
      reason_text: "test",
      numerical_answer: 1,
      numerical_tolerance: 1,
      position: 1,
      model_answer: "test"
    }
  ]);
  console.log("Error:", error);
}
check();
