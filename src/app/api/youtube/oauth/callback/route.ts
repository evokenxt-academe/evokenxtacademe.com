/**
 * GET /api/youtube/oauth/callback?code=...
 * Handles OAuth callback and stores refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`/admin/live-streams?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`/admin/live-streams?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.json();
      throw new Error(error.error_description || 'Failed to exchange code for tokens');
    }

    const tokenData = await tokenRes.json();

    // Get user email from id_token or info endpoint
    let adminEmail = 'amarbiradar147@gmail.com';

    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (infoRes.ok) {
        const userInfo = await infoRes.json();
        adminEmail = userInfo.email;
      }
    } catch (e) {
      // Fallback to default email
    }

    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users?.users?.find(u => u.email === adminEmail);

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Upsert YouTube token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const tokenUpdate: any = {
      user_id: adminUser.id,
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString(),
      scopes: tokenData.scope,
      updated_at: new Date().toISOString(),
    };

    // Only update refresh_token if provided (Google only sends it on first consent or with prompt=consent)
    if (tokenData.refresh_token) {
      tokenUpdate.refresh_token = tokenData.refresh_token;
    }

    const { error: upsertError } = await supabase
      .from('youtube_tokens')
      .upsert(tokenUpdate);

    if (upsertError) {
      throw new Error(`Failed to save token: ${upsertError.message}`);
    }

    // Redirect to stream creation page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    return NextResponse.redirect(`${baseUrl}/admin/live-streams?success=connected`);
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return NextResponse.redirect(`/admin/live-streams?error=oauth_failed`);
  }
}
