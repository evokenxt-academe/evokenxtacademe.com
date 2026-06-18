import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";
import { createAdminClient } from "./utils/supabase/adminClient";
import {
    HEARTBEAT_INTERVAL_MS,
    LMS_HEARTBEAT_COOKIE,
    LMS_SESSION_COOKIE,
} from "./lib/auth/single-session";

const AUTH_EXEMPT_PATHS = new Set([
    "/auth/session-expired",
    "/auth/active-session",
]);

export async function proxy(req: NextRequest) {
    const { supabase, supabaseResponse } = createClient(req);

    // Refresh session if expired and get user
    const { data: { user } } = await supabase.auth.getUser();

    const path = req.nextUrl.pathname;

    // Enforce single active session check for all authenticated users
    if (user && !AUTH_EXEMPT_PATHS.has(path)) {
        const cookieSessionId = req.cookies.get(LMS_SESSION_COOKIE)?.value;

        const { data: dbUser } = await supabase
            .from("users")
            .select("current_session_id, role")
            .eq("id", user.id)
            .single();

        if (dbUser?.current_session_id && cookieSessionId !== dbUser.current_session_id) {
            const expiredUrl = new URL("/auth/session-expired", req.url);
            const response = NextResponse.redirect(expiredUrl);
            response.cookies.delete(LMS_SESSION_COOKIE);
            response.cookies.delete(LMS_HEARTBEAT_COOKIE);
            return response;
        }

        // Heartbeat: keep session_last_seen_at fresh for single-session enforcement
        if (
            dbUser?.current_session_id &&
            cookieSessionId === dbUser.current_session_id &&
            (dbUser.role === "student" || !dbUser.role)
        ) {
            const lastHeartbeat = Number(req.cookies.get(LMS_HEARTBEAT_COOKIE)?.value ?? 0);
            const now = Date.now();

            if (!lastHeartbeat || now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
                try {
                    const adminClient = createAdminClient();
                    await adminClient
                        .from("users")
                        .update({ session_last_seen_at: new Date().toISOString() })
                        .eq("id", user.id);

                    supabaseResponse.cookies.set(LMS_HEARTBEAT_COOKIE, String(now), {
                        path: "/",
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 60 * 60,
                    });
                } catch (err) {
                    console.error("Session heartbeat update failed:", err);
                }
            }
        }
    }

    // Define protected routes that require authentication
    const isProtectedRoute =
        path.startsWith("/admin") ||
        path.startsWith("/dashboard") ||
        path.startsWith("/learn") ||
        path.startsWith("/quiz") ||
        path.startsWith("/cart");

    // Define auth routes that authenticated users shouldn't access
    const isAuthRoute =
        path.startsWith("/auth/") && !AUTH_EXEMPT_PATHS.has(path);
    const isLandingPage = path === "/";

    // Redirect to login if not authenticated and trying to access a protected route
    if (!user && isProtectedRoute) {
        const redirectUrl = new URL("/auth/login", req.url);
        redirectUrl.searchParams.set("redirectUrl", path);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect based on role if authenticated and trying to access auth routes or landing page
    if (user && (isAuthRoute || isLandingPage)) {
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
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
