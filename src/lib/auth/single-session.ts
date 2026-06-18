/** How long without a heartbeat before a session is considered inactive. */
export const SESSION_STALE_MS = 15 * 60 * 1000;

export const LMS_SESSION_COOKIE = "lms_session_id";
export const LMS_HEARTBEAT_COOKIE = "lms_heartbeat";
export const HEARTBEAT_INTERVAL_MS = 60_000;

export interface SessionProfile {
  current_session_id: string | null;
  session_last_seen_at: string | null;
  role?: string | null;
}

export function buildSessionCookieOptions() {
  return {
    path: "/" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function isSessionRecentlyActive(
  profile: Pick<SessionProfile, "current_session_id" | "session_last_seen_at">,
): boolean {
  if (!profile.current_session_id || !profile.session_last_seen_at) {
    return false;
  }
  const lastSeen = new Date(profile.session_last_seen_at).getTime();
  if (Number.isNaN(lastSeen)) return false;
  return Date.now() - lastSeen < SESSION_STALE_MS;
}

/**
 * Returns the number of Supabase auth sessions for a user, or null if unavailable.
 */
export async function countSupabaseAuthSessions(
  userId: string,
): Promise<number | null> {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}/sessions`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (Array.isArray(data)) return data.length;
    if (
      data &&
      typeof data === "object" &&
      "sessions" in data &&
      Array.isArray((data as { sessions: unknown[] }).sessions)
    ) {
      return (data as { sessions: unknown[] }).sessions.length;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * True when another device/browser likely still holds an active login.
 * After OAuth, `sessionCountAfterLogin` includes the session just created.
 */
export function hasActiveSessionElsewhere(
  existingProfile: Pick<
    SessionProfile,
    "current_session_id" | "session_last_seen_at"
  > | null,
  sessionCountAfterLogin: number | null,
): boolean {
  if (sessionCountAfterLogin !== null && sessionCountAfterLogin > 1) {
    return true;
  }

  if (existingProfile && isSessionRecentlyActive(existingProfile)) {
    return true;
  }

  return false;
}

/** Students are limited to one concurrent session. */
export function isSingleSessionEnforced(role: string | null | undefined): boolean {
  return role === "student" || role == null;
}
