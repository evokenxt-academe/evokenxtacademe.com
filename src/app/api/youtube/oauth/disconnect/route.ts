/**
 * DELETE /api/youtube/oauth/disconnect
 * Disconnects YouTube account (revokes token and deletes from DB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    // Get admin user
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users?.users?.find(u => u.email === 'amarbiradar147@gmail.com');

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get token
    const { data: token } = await supabase
      .from('youtube_tokens')
      .select('access_token')
      .eq('user_id', adminUser.id)
      .single();

    if (token?.access_token) {
      // Revoke token with Google
      try {
        await fetch('https://oauth2.googleapis.com/revoke?token=' + token.access_token, {
          method: 'POST',
        });
      } catch (e) {
        // Ignore revocation errors
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('youtube_tokens')
      .delete()
      .eq('user_id', adminUser.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
