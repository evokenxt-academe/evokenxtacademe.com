import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function proxy(req: NextRequest) {
    const { supabase, supabaseResponse } = createClient(req);

    const { data: { user } } = await supabase.auth.getUser();
    return supabaseResponse;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"]
}
