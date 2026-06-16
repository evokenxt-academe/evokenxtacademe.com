import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || '';

  // Helper to build redirect URL with from param preserved
  const getRedirectUrl = (params: Record<string, string>) => {
    const url = new URL('/admin/youtube/connect', req.url);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (state) {
      url.searchParams.set('from', state);
    }
    return url.toString();
  };

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(getRedirectUrl({ error: 'oauth_rejected' }));
  }

  if (!code) {
    return NextResponse.redirect(getRedirectUrl({ error: 'no_code' }));
  }

  // Build the exact same redirect URI as the authorize route
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  
  // Quick fix for localhost to avoid redirect_uri mismatch during token exchange if https was assumed
  const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
  
  // Note: we're using the same logic as authorize route to match EXACTLY what Google saw
  // However, authorize route has a bug where it falls back to 'https' for localhost if x-forwarded-proto is missing.
  // We'll try the resolvedProtocol first, and if it fails, we'll try the exact same construction as authorize.
  const redirectUri = `${protocol}://${host}/api/youtube/oauth/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });

    let tokenData = await tokenResponse.json();

    // If it fails due to redirect_uri_mismatch on localhost, try the 'http' protocol instead
    if (!tokenResponse.ok && tokenData.error === 'redirect_uri_mismatch' && isLocalhost) {
      const httpRedirectUri = `http://${host}/api/youtube/oauth/callback`;
      const retryTokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: httpRedirectUri,
        }).toString(),
      });
      const retryData = await retryTokenResponse.json();
      if (retryTokenResponse.ok) {
        tokenData = retryData;
      } else {
        console.error('Token response error (retry):', retryData);
        return NextResponse.redirect(getRedirectUrl({ error: 'token_exchange_failed' }));
      }
    } else if (!tokenResponse.ok) {
      console.error('Token response error:', tokenData);
      return NextResponse.redirect(getRedirectUrl({ error: 'token_exchange_failed' }));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users?.users?.find(u => u.email === 'amarbiradar147@gmail.com');

    if (!adminUser) {
      console.error('Admin user not found');
      return NextResponse.redirect(getRedirectUrl({ error: 'admin_not_found' }));
    }

    // Check if a token already exists
    const { data: existingToken } = await supabase
      .from('youtube_tokens')
      .select('refresh_token')
      .eq('user_id', adminUser.id)
      .single();

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    
    // We only get a refresh token on the first authorization or if prompt=consent is passed
    const refreshToken = tokenData.refresh_token || existingToken?.refresh_token;

    if (!refreshToken) {
      console.error('No refresh token received and no existing refresh token found.');
      // Proceed anyway, but it won't auto-refresh. The authorize route correctly uses prompt=consent though.
    }

    // Log what Google actually granted vs what we requested
    const grantedScopes = tokenData.scope || '';
    console.log('[YouTube OAuth] Granted scopes from Google:', grantedScopes);
    console.log('[YouTube OAuth] Refresh token received:', !!tokenData.refresh_token);

    // Store the REQUESTED scopes (what we asked for) since Google may return a shortened format
    // Google sometimes returns "email profile openid https://..." instead of full scope URIs
    // We trust that if the user consented, all requested scopes were granted
    const requestedScopes = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.email';

    // Delete existing to avoid upsert complexities if not perfectly configured
    await supabase.from('youtube_tokens').delete().eq('user_id', adminUser.id);

    const { error: insertError } = await supabase
      .from('youtube_tokens')
      .insert({
        user_id: adminUser.id,
        access_token: tokenData.access_token,
        refresh_token: refreshToken || '', 
        expires_at: expiresAt,
        scopes: requestedScopes,
      });

    if (insertError) {
      console.error('Failed to save token to database:', insertError);
      return NextResponse.redirect(getRedirectUrl({ error: 'db_save_failed' }));
    }

    return NextResponse.redirect(getRedirectUrl({ success: 'youtube_connected' }));
  } catch (error) {
    console.error('Callback handler error:', error);
    return NextResponse.redirect(getRedirectUrl({ error: 'internal_error' }));
  }
}
