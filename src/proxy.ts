import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function proxy(req: NextRequest) {
    const { supabase, supabaseResponse } = createClient(req);

    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (!user && req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }


    return supabaseResponse;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"]
}
