import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const ADMIN_EMAIL = "amarbiradar147@gmail.com";

export async function middleware(request: NextRequest) {
    // Skip middleware for non-admin routes
    if (!request.nextUrl.pathname.startsWith("/admin")) {
        return;
    }

    const { supabase, supabaseResponse } = createClient(request);

    // Get the authenticated user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (!user) {
        return NextResponse.redirect(new URL("/auth/login", request.url), 307);
    }

    // Check if user email matches admin email
    if (user.email !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/unauthorized", request.url), 307);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
