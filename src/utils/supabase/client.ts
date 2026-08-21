import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
    createBrowserClient<Database>(
        supabaseUrl!,
        supabaseKey!,
        {
            cookieOptions: {
                maxAge: 60 * 60 * 24 * 365, // 1 year permanent session
                sameSite: "lax",
                path: "/",
            },
        }
    );

