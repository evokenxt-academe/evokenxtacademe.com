import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courses")
        .select(
            "id, slug, thumbnail_url, level, name, description, discount_price, price, instructor:users!instructor_id(name, avatar)",
        )
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses: data ?? [] });
}