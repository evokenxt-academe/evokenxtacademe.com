/**
 * DELETE /api/youtube/oauth/disconnect
 * Disconnects YouTube account (revokes token and deletes from DB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findAdminUser } from '@/lib/youtube/admin-user';

export async function DELETE(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    // Get admin user (paginated to handle large user tables)
    const adminUser = await findAdminUser(supabase);

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
