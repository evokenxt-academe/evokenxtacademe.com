import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/adminClient";
import { createClient } from "@/utils/supabase/server";

type AdminRole = "admin" | "instructor";

type RequireAdminResult =
    | {
        supabase: ReturnType<typeof createAdminClient>;
        userId: string;
    }
    | {
        error: NextResponse;
    };

function isAllowlistedAdminEmail(email?: string | null): boolean {
    if (!email) return false;

    const raw = process.env.NEXT_PUBLIC_ADMINS_EMAILS || "";
    if (!raw) return false;

    const allowlist = raw
        .split(";")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    return allowlist.includes(email.toLowerCase());
}

export async function requireAdmin(
    allowedRoles: AdminRole[] = ["admin"],
): Promise<RequireAdminResult> {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const supabaseAdmin = createAdminClient();
    const profileQuery = async () => {
        const byId = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (byId.data?.role || byId.error || !user.email) {
            return byId;
        }

        return supabaseAdmin
            .from("users")
            .select("role")
            .eq("email", user.email)
            .maybeSingle();
    };

    const { data: profile, error: profileError } = await profileQuery();

    if (profileError) {
        return {
            error: NextResponse.json(
                { error: profileError.message },
                { status: 500 },
            ),
        };
    }

    const role = profile?.role as AdminRole | undefined;
    const allowlistedAdmin = isAllowlistedAdminEmail(user.email);

    if (role && allowedRoles.includes(role)) {
        return {
            supabase: supabaseAdmin,
            userId: user.id,
        };
    }

    if (allowlistedAdmin && allowedRoles.includes("admin")) {
        return {
            supabase: supabaseAdmin,
            userId: user.id,
        };
    }

    return {
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
}