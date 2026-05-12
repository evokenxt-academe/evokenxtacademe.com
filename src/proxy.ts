import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function proxy(req: NextRequest) {
    const { supabase, supabaseResponse } = createClient(req);

    // Refresh session if expired and get user
    const { data: { user } } = await supabase.auth.getUser();

    const path = req.nextUrl.pathname;

    // Define protected routes that require authentication
    const isProtectedRoute =
        path.startsWith("/admin") ||
        path.startsWith("/dashboard") ||
        path.startsWith("/learn") ||
        path.startsWith("/quiz") ||
        path.startsWith("/cart");

    // Define auth routes that authenticated users shouldn't access
    const isAuthRoute = path.startsWith("/auth/");
    const isLandingPage = path === "/";

    // Redirect to login if not authenticated and trying to access a protected route
    if (!user && isProtectedRoute) {
        const redirectUrl = new URL("/auth/login", req.url);
        // Add the current path as a redirect parameter so they can return after login
        redirectUrl.searchParams.set("redirectUrl", path);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect based on role if authenticated and trying to access auth routes or landing page
    if (user && (isAuthRoute || isLandingPage)) {
        // Fetch user role
        const { data: dbUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (dbUser?.role === 'admin' || dbUser?.role === 'instructor') {
            return NextResponse.redirect(new URL("/admin", req.url));
        } else {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - .*\\.(?:svg|png|jpg|jpeg|gif|webp)$ (image files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
