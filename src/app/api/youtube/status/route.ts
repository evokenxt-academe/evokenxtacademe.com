/**
 * GET /api/youtube/status
 * Checks if YouTube is connected and returns connection details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChannelInfo } from '@/lib/youtube/api';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users?.users?.find(u => u.email === 'amarbiradar147@gmail.com');

    if (!adminUser) {
      return NextResponse.json({ connected: false, reason: 'admin_not_found' });
    }

    // Check for token
    const { data: token, error } = await supabase
      .from('youtube_tokens')
      .select('user_id, expires_at, scopes, updated_at')
      .eq('user_id', adminUser.id)
      .maybeSingle();

    if (error || !token) {
      return NextResponse.json({ connected: false, reason: 'no_token' });
    }

    const expiresAt = new Date(token.expires_at);
    const isExpired = expiresAt < new Date();

    // Check if the token has the required youtube scopes for broadcast access
    const scopes = typeof token.scopes === 'string'
      ? token.scopes
      : Array.isArray(token.scopes) ? token.scopes.join(' ') : '';
    
    // We need the full youtube scope (not just readonly) for broadcast management
    const scopeList = scopes.split(/\s+/);
    const hasFullScope = scopeList.some(s => 
      s === 'https://www.googleapis.com/auth/youtube' || 
      s.endsWith('/auth/youtube')
    );
    const hasForceSsl = scopeList.some(s => s.includes('youtube.force-ssl'));
    const hasRequiredScopes = hasFullScope && hasForceSsl;

    // Try to get channel info if connected
    let channelInfo: any = null;
    if (!isExpired && hasRequiredScopes) {
      try {
        channelInfo = await getChannelInfo();
      } catch (e) {
        console.error('Error fetching channel info directly:', e);
        // Channel info is optional
      }
    }

    return NextResponse.json({
      connected: !isExpired,
      expired: isExpired,
      needsReauth: !hasRequiredScopes,
      scopes,
      lastUpdated: token.updated_at,
      channel: channelInfo,
    });
  } catch (error) {
    console.error('YouTube status check error:', error);
    return NextResponse.json({ connected: false, reason: 'error' }, { status: 500 });
  }
}
