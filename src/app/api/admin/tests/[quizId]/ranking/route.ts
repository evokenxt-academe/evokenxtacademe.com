import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: userRow } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userRow || userRow.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all submitted/timed_out attempts for this quiz
  const { data: attempts, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .select("id, user_id, score, total_marks, status, started_at, submitted_at")
    .eq("quiz_id", quizId)
    .in("status", ["submitted", "timed_out"])
    .order("score", { ascending: false });

  if (attemptError) {
    return NextResponse.json(
      { error: "Failed to fetch attempts." },
      { status: 500 },
    );
  }

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ ranking: [] });
  }

  // Fetch user details for all participants
  const userIds = [...new Set(attempts.map((a) => a.user_id))];
  const { data: users } = await adminClient
    .from("users")
    .select("id, name, email, avatar")
    .in("id", userIds);

  const userMap = new Map<
    string,
    { name: string | null; email: string; avatar: string | null }
  >();
  for (const u of users ?? []) {
    userMap.set(u.id, { name: u.name, email: u.email, avatar: u.avatar });
  }

  // Best attempt per user (highest score, then earliest submission)
  const bestAttemptByUser = new Map<
    string,
    {
      score: number;
      totalMarks: number;
      submittedAt: string | null;
      startedAt: string;
      status: string;
      durationSec: number | null;
    }
  >();

  for (const attempt of attempts) {
    const score = toNumber(attempt.score);
    const existing = bestAttemptByUser.get(attempt.user_id);
    if (!existing || score > existing.score) {
      let durationSec: number | null = null;
      if (attempt.started_at && attempt.submitted_at) {
        durationSec = Math.round(
          (new Date(attempt.submitted_at).getTime() -
            new Date(attempt.started_at).getTime()) /
            1000,
        );
      }
      bestAttemptByUser.set(attempt.user_id, {
        score,
        totalMarks: toNumber(attempt.total_marks),
        submittedAt: attempt.submitted_at,
        startedAt: attempt.started_at,
        status: attempt.status ?? "submitted",
        durationSec,
      });
    }
  }

  // Sort by score DESC, then by submittedAt ASC (tie-breaker)
  const sorted = [...bestAttemptByUser.entries()].sort((a, b) => {
    if (b[1].score !== a[1].score) return b[1].score - a[1].score;
    const aTime = a[1].submittedAt ? new Date(a[1].submittedAt).getTime() : Infinity;
    const bTime = b[1].submittedAt ? new Date(b[1].submittedAt).getTime() : Infinity;
    return aTime - bTime;
  });

  const ranking = sorted.map(([userId, data], index) => {
    const userInfo = userMap.get(userId);
    const totalMarks = data.totalMarks || 1;
    return {
      rank: index + 1,
      userId,
      name: userInfo?.name ?? "Unknown",
      email: userInfo?.email ?? "",
      avatar: userInfo?.avatar ?? null,
      initials: getInitials(userInfo?.name ?? null),
      score: data.score,
      totalMarks: data.totalMarks,
      percentage: Math.round((data.score / totalMarks) * 100),
      durationSec: data.durationSec,
      submittedAt: data.submittedAt,
      status: data.status,
    };
  });

  return NextResponse.json({ ranking });
}
