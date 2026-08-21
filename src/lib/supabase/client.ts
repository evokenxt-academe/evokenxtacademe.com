import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                maxAge: 60 * 60 * 24 * 365, // 1 year permanent session
                sameSite: "lax",
                path: "/",
            },
        }
    );
}

// Re-export for convenience in components
export const supabase = createClient();
