import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courses")
        .select(
            "id, slug, thumbnail_url, name:title, description, instructor:users!instructor_id(name, avatar), subject:subjects!inner(program_level:program_levels!inner(label, program:programs(body))), pricing:course_pricing(base_price, discounted_price, is_active)",
        )
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deriveLevel = (label?: string | null) => {
        switch (label) {
            case "Applied Knowledge":
            case "Level I":
            case "Part 1":
                return "knowledge";
            case "Applied Skills":
            case "Level II":
                return "skills";
            default:
                return "professional";
        }
    };

    const courses = (data ?? []).map((course: any) => {
        const activePricing = (course.pricing ?? []).find((tier: any) => tier?.is_active);

        return {
            ...course,
            level: deriveLevel(course.subject?.program_level?.label),
            price: activePricing?.discounted_price ?? activePricing?.base_price ?? 0,
            discount_price: activePricing?.discounted_price ?? null,
        };
    });

    return NextResponse.json({ courses });
}