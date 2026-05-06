import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    createLookupMap,
    normalizeCourse,
    normalizeEnrollment,
    normalizeUser,
} from "@/features/admin/lib/admin-normalizers";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    const [enrollmentsResult, usersResult, coursesResult] = await Promise.all([
        supabase
            .from("enrollments")
            .select("*")
            .order("enrolled_at", { ascending: false }),
        supabase
            .from("users")
            .select("id, name, email, avatar, role, created_at")
            .order("created_at", { ascending: false }),
        supabase
            .from("courses")
            .select("id, title, slug, status")
            .order("created_at", { ascending: false }),
    ]);

    const errors = [
        enrollmentsResult.error,
        usersResult.error,
        coursesResult.error,
    ].filter(Boolean);

    if (errors.length) {
        const message =
            (errors[0] as { message?: string }).message ||
            "Failed to load enrollments";
        return NextResponse.json({ error: message }, { status: 500 });
    }

    const users = (usersResult.data ?? []).map(normalizeUser);
    const courses = (coursesResult.data ?? []).map((row) =>
        normalizeCourse(row as Record<string, unknown>),
    );
    const userMap = createLookupMap(users);
    const courseMap = createLookupMap(courses);

    const enrollments = (enrollmentsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const userName = userMap.get(String(record.user_id))?.name;
        const courseName = courseMap.get(String(record.course_id))?.name;
        return normalizeEnrollment(record, userName, courseName);
    });

    return NextResponse.json({ enrollments, users, courses });
}

export async function POST(request: Request) {
    const auth = await requireAdmin(["admin"]);
    if ("error" in auth) {
        return auth.error;
    }

    const { supabase } = auth;

    let body: { email?: string; courseId?: string; expiresAt?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 },
        );
    }

    const { email, courseId, expiresAt } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json(
            { error: "A valid email address is required" },
            { status: 400 },
        );
    }

    if (!courseId || typeof courseId !== "string") {
        return NextResponse.json(
            { error: "A valid Course ID is required" },
            { status: 400 },
        );
    }

    // Validate course exists
    const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", courseId)
        .single();

    if (courseError || !course) {
        return NextResponse.json(
            { error: "Course not found" },
            { status: 404 },
        );
    }

    // Resolve user by email
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("email", email.trim().toLowerCase())
        .single();

    if (userError || !user) {
        return NextResponse.json(
            { error: `No user found with email "${email}"` },
            { status: 404 },
        );
    }

    // Check for existing enrollment
    const { data: existing } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

    if (existing?.status === "active") {
        return NextResponse.json(
            {
                error: `${user.name} is already actively enrolled in ${course.title}`,
            },
            { status: 409 },
        );
    }

    // Validate expiry date if provided
    let parsedExpiry: string | null = null;
    if (expiresAt && typeof expiresAt === "string") {
        const expiryDate = new Date(expiresAt);
        if (Number.isNaN(expiryDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid expiry date format" },
                { status: 400 },
            );
        }
        if (expiryDate <= new Date()) {
            return NextResponse.json(
                { error: "Expiry date must be in the future" },
                { status: 400 },
            );
        }
        parsedExpiry = expiryDate.toISOString();
    }

    // Upsert enrollment (handles reactivation of expired/refunded)
    const { error: enrollError } = await supabase.from("enrollments").upsert(
        {
            user_id: user.id,
            course_id: courseId,
            status: "active",
            enrolled_at: new Date().toISOString(),
            expires_at: parsedExpiry,
        },
        { onConflict: "user_id,course_id" },
    );

    if (enrollError) {
        return NextResponse.json(
            { error: enrollError.message },
            { status: 500 },
        );
    }

    return NextResponse.json({
        success: true,
        message: `${user.name} enrolled in ${course.title}`,
    });
}