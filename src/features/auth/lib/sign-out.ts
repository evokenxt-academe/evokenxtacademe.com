import { createClient } from "@/utils/supabase/client";

/**
 * Signs the user out and clears the server-side single-session record.
 */
export async function signOutUser(redirectTo = "/"): Promise<void> {
  try {
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
  } catch {
    // Continue with client sign-out even if API fails
  }

  const supabase = createClient();
  await supabase.auth.signOut({ scope: "local" });

  document.cookie =
    "lms_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie =
    "lms_heartbeat=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

  window.location.href = redirectTo;
}
