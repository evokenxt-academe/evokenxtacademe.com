import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function listCourses() {
    const { data, error } = await supabase
        .from("courses")
        .select("id, name, slug, status")
    
    if (error) {
        console.error("Error fetching courses:", error)
        return
    }

    console.log("Existing Courses:")
    console.table(data)
}

listCourses()
