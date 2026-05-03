import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: course } = await supabase.from("courses").select("id, name").eq("slug", "financial-transactions-fa1").single();
    console.log("Course:", course);

    const { data: allStreams } = await supabase.from("live_streams").select("*");
    console.log("All Streams:", allStreams);
}

main();
