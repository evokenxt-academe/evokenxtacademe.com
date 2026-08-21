import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";
import { createAdminClient } from "./utils/supabase/adminClient";
import {
    HEARTBEAT_INTERVAL_MS,
    LMS_HEARTBEAT_COOKIE,
    LMS_SESSION_COOKIE,
    buildSessionCookieOptions,
} from "./lib/auth/single-session";

const AUTH_EXEMPT_PATHS = new Set([
    "/auth/session-expired",
    "/auth/active-session",
]);

/**
 * Helper to copy all cookies from the Supabase response to a redirect response
 * so refreshed auth tokens are never dropped during navigation.
 */
function createRedirectWithCookies(
    redirectUrl: URL | string,
    supabaseResponse: NextResponse
): NextResponse {
    const response = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
    });
    return response;
}

export async function proxy(req: NextRequest) {
    const { supabase, supabaseResponse } = createClient(req);

    // Refresh session if expired and get user
    const { data: { user } } = await supabase.auth.getUser();

    const path = req.nextUrl.pathname;

    // Session maintenance for authenticated users
    if (user && !AUTH_EXEMPT_PATHS.has(path)) {
        const cookieSessionId = req.cookies.get(LMS_SESSION_COOKIE)?.value;

        // Fetch DB user record
        const { data: dbUser } = await supabase
            .from("users")
            .select("current_session_id, role")
            .eq("id", user.id)
            .maybeSingle();

        // Keep session persistent: if cookie is missing or DB session is unset, ensure it's synced
        if (!cookieSessionId && dbUser?.current_session_id) {
            supabaseResponse.cookies.set(
                LMS_SESSION_COOKIE,
                dbUser.current_session_id,
                buildSessionCookieOptions()
            );
        } else if (!dbUser?.current_session_id) {
            const newSessionId = crypto.randomUUID();
            try {
                const adminClient = createAdminClient();
                await adminClient
                    .from("users")
                    .update({
                        current_session_id: newSessionId,
                        session_last_seen_at: new Date().toISOString(),
                    })
                    .eq("id", user.id);

                supabaseResponse.cookies.set(
                    LMS_SESSION_COOKIE,
                    newSessionId,
                    buildSessionCookieOptions()
                );
            } catch (err) {
                console.error("Failed to sync session ID:", err);
            }
        }

        // Heartbeat: keep session_last_seen_at fresh
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
                    maxAge: 60 * 60 * 24 * 365,
                });
            } catch (err) {
                console.error("Session heartbeat update failed:", err);
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
        return createRedirectWithCookies(redirectUrl, supabaseResponse);
    }

    // Redirect based on role if authenticated and trying to access auth routes or landing page
    if (user && (isAuthRoute || isLandingPage)) {
        const { data: dbUser } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (dbUser?.role === "admin" || dbUser?.role === "instructor") {
            return createRedirectWithCookies(new URL("/admin", req.url), supabaseResponse);
        } else {
            return createRedirectWithCookies(new URL("/dashboard", req.url), supabaseResponse);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
