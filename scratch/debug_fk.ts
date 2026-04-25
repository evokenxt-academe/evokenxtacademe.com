import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function checkSchema() {
    // Check courses columns
    const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'courses' }) // If this RPC exists
    
    // Fallback: use a raw query if possible or just check values
    const { data: sample } = await supabase
        .from("courses")
        .select("*")
        .limit(1)

    console.log("Sample Course Row:")
    console.log(JSON.stringify(sample?.[0], null, 2))
}

async function listConstraints() {
    // This is hard without direct SQL access, but let's try to insert a dummy section
    const { error } = await supabase
        .from("sections")
        .insert({
            id: '00000000-0000-0000-0000-000000000000',
            course_id: '00000000-0000-0000-0000-000000000000', // Definitely non-existent
            title: 'Test',
            position: 0
        })
    
    console.log("Forced FK error details:")
    console.log(error)
}

// checkSchema()
listConstraints()
