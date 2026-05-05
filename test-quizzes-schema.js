const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await client.from("quizzes").select("*").limit(1);
    if (error) {
        console.error("Error fetching quizzes:", error);
    } else {
        console.log("Quizzes schema (first row keys):", data.length > 0 ? Object.keys(data[0]) : "No rows, but query succeeded");
    }
}
run();
