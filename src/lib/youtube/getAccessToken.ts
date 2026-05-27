/**
 * Get fresh YouTube access token
 * Automatically refreshes if expired or expiring within 5 minutes
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAccessToken(email: string = 'amarbiradar147@gmail.com'): Promise<string> {
  // Get current token
  const { data: token, error } = await supabase
    .from('youtube_tokens')
    .select('access_token, expires_at, refresh_token, user_id, scopes')
    .eq('user_id', (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.email === email)?.id)
    .single();

  if (error || !token) {
    throw new Error('YouTube token not found. Please connect your YouTube account.');
  }

  if (!token.refresh_token) {
    throw new Error('No refresh token stored. Please reconnect your YouTube account.');
  }

  // Verify required scopes are present
  // If scopes field is empty/missing, assume it's an old token that needs reauth
  const scopes = token.scopes || '';
  if (scopes) {
    const scopeList = scopes.split(/\s+/);
    const hasFullScope = scopeList.some((s: string) => 
      s === 'https://www.googleapis.com/auth/youtube' || 
      s.endsWith('/auth/youtube')
    );
    if (!hasFullScope) {
      throw new Error('Request had insufficient authentication scopes. Please reconnect your YouTube account with full broadcast permissions.');
    }
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // If token expires within 5 minutes, refresh it
  if (expiresAt < fiveMinutesFromNow) {
    const refreshResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
        }).toString(),
      }
    );

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh YouTube token: ${refreshData.error}`);
    }

    // Update token in database
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

  return token.access_token;
}
