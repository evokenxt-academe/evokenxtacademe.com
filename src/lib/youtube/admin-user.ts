/**
 * Shared helper to resolve the YouTube admin user from Supabase Auth.
 *
 * `supabase.auth.admin.listUsers()` returns only the first page (50 users).
 * If the admin account isn't on that first page it silently returns
 * `admin_not_found`.  This helper paginates through ALL pages so it always
 * finds the admin regardless of user count.
 */

import { SupabaseClient } from '@supabase/supabase-js';

const ADMIN_EMAIL =
  process.env.YOUTUBE_ADMIN_EMAIL || 'evokenxtacademe@gmail.com';

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Paginate through `auth.admin.listUsers()` and return the admin user
 * whose email matches YOUTUBE_ADMIN_EMAIL (default: evokenxtacademe@gmail.com).
 *
 * Returns `null` when the user genuinely doesn't exist.
 */
export async function findAdminUser(
  supabase: SupabaseClient,
): Promise<AdminUser | null> {
  const PAGE_SIZE = 1000; // max allowed by Supabase
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      console.error('[findAdminUser] listUsers error:', error.message);
      return null;
    }

    const users = data?.users ?? [];
    const match = users.find(
      (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    );

    if (match) {
      return { id: match.id, email: match.email! };
    }

    // If we got fewer users than PAGE_SIZE, there are no more pages
    if (users.length < PAGE_SIZE) {
      break;
    }

    page++;
  }

  console.error(
    `[findAdminUser] Admin user with email "${ADMIN_EMAIL}" not found after scanning all pages.`,
  );
  return null;
}
