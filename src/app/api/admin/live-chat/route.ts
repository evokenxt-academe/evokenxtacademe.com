import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    createLookupMap,
    normalizeChatMessage,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [messagesResult, usersResult, streamsResult] = await Promise.all([
        supabase.from("chat_messages").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, name, email").order("created_at", { ascending: false }),
        supabase.from("live_streams").select("id, title").order("scheduled_at", { ascending: false }),
    ]);

    const errors = [messagesResult.error, usersResult.error, streamsResult.error].filter(Boolean);
    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load chat messages";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const userMap = createLookupMap(users);
    const streamMap = new Map((streamsResult.data ?? []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]));

    const chatMessages = (messagesResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const user = userMap.get(String(record.user_id))?.name;
        const stream = streamMap.get(String(record.stream_id))?.title as string | undefined;
        return normalizeChatMessage(record, stream, user);
    });

    return NextResponse.json({ chatMessages });
}