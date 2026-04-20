import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, serviceRoleKey)

async function run() {
    const { data: tables } = await client.rpc('get_tables_or_something') // won't work
    
    // Attempt standard sql via REST is not possible, we will just query some common tables
    const checks = ['settings', 'config', 'secrets', 'integrations']
    for (const t of checks) {
        const { error } = await client.from(t).select('*').limit(1)
        if (!error) {
            console.log("FOUND TABLE:", t)
            return
        }
    }
    console.log("No common settings table found")
}
run()
