/**
 * Get fresh YouTube access token for an admin user.
 * Automatically refreshes if expired or expiring within 5 minutes.
 */

import { createClient } from '@supabase/supabase-js';
import { findAdminUser } from './admin-user';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
);

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;

  const adminUser = await findAdminUser(supabase);
  if (!adminUser) {
    throw new Error('Admin user not found. Please connect your YouTube account.');
  }
  return adminUser.id;
}

export async function getAccessTokenForUser(userId?: string): Promise<string> {
  const resolvedUserId = await resolveUserId(userId);

  const { data: token, error } = await supabase
    .from('youtube_tokens')
    .select('access_token, expires_at, refresh_token, user_id, scopes')
    .eq('user_id', resolvedUserId)
    .single();

  if (error || !token) {
    throw new Error('YouTube token not found. Please connect your YouTube account.');
  }

  if (!token.refresh_token) {
    throw new Error('No refresh token stored. Please reconnect your YouTube account.');
  }

  const scopes = token.scopes || '';
  if (scopes) {
    const scopeList = scopes.split(/\s+/);
    const hasFullScope = scopeList.some(
      (s: string) =>
        s === 'https://www.googleapis.com/auth/youtube' || s.endsWith('/auth/youtube'),
    );
    if (!hasFullScope) {
      throw new Error(
        'Insufficient authentication scopes. Please reconnect with full broadcast permissions.',
      );
    }
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt < fiveMinutesFromNow) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh YouTube token: ${refreshData.error}`);
    }

    const newExpiresAt = new Date(now.getTime() + refreshData.expires_in * 1000);
    await supabase
      .from('youtube_tokens')
      .update({
        access_token: refreshData.access_token,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', token.user_id);

    return refreshData.access_token;
  }

  return token.access_token!;
}

/** @deprecated Use getAccessTokenForUser */
export async function getAccessToken(): Promise<string> {
  const adminUser = await findAdminUser(supabase);
  return getAccessTokenForUser(adminUser?.id);
}
