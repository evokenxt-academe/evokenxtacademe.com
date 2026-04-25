import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function debugSchema() {
    console.log("Checking table structures...")
    
    // Check Courses
    const { data: courseCols, error: e1 } = await supabase.rpc('get_table_info', { tname: 'courses' }).catch(() => ({ data: null, error: 'RPC missing' }))
    
    // If RPC fails, try a manual check by inserting and catching the error type
    const { data: sampleCourse } = await supabase.from('courses').select('id').limit(1)
    console.log("Sample Course ID type:", typeof sampleCourse?.[0]?.id, sampleCourse?.[0]?.id)

    const { data: sampleSection } = await supabase.from('sections').select('course_id').limit(1)
    console.log("Sample Section course_id type:", typeof sampleSection?.[0]?.course_id, sampleSection?.[0]?.course_id)
}

debugSchema()
