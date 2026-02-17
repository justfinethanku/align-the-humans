/**
 * Fetch Active Alignment Invite
 *
 * GET /api/alignment/[id]/invite
 *
 * Returns the current active invite link (if any) for the alignment creator.
 * Decrypts the stored token ciphertext to reconstruct the shareable URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { decryptInviteToken } from '@/app/lib/invite-tokens';
import { createErrorResponse, AlignmentError, AuthError } from '@/app/lib/errors';

interface InviteResponse {
  token: string;
  invite_url: string;
  expires_at: string;
  max_uses: number | null;
  current_uses: number | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const supabase = createServerClient();

  try {
    const user = await requireAuth(supabase);

    // Ensure alignment exists and user is the creator
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('id, created_by, current_invite_id')
      .eq('id', id)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(id);
    }

    if (alignment.created_by !== user.id) {
      throw new AuthError(
        'Only the alignment creator can view invite links',
        403,
        { alignmentId: id, userId: user.id }
      );
    }

    if (!alignment.current_invite_id) {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_FOUND', message: 'No active invite' } },
        { status: 404 }
      );
    }

    // Fetch current invite details
    const { data: invitation, error: inviteError } = await supabase
      .from('alignment_invitations')
      .select('id, expires_at, max_uses, current_uses, invalidated_at, token_ciphertext')
      .eq('id', alignment.current_invite_id)
      .single();

    if (inviteError || !invitation) {
      throw AlignmentError.notFound(id);
    }

    const now = new Date();
    const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : null;
    const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;

    if (invitation.invalidated_at || isExpired || !invitation.token_ciphertext) {
      return NextResponse.json(
        { error: { code: 'INVITE_NOT_FOUND', message: 'No active invite' } },
        { status: 404 }
      );
    }

    const token = decryptInviteToken(invitation.token_ciphertext);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/join/${token}`;

    return NextResponse.json(
      {
        token,
        invite_url: inviteUrl,
        expires_at: invitation.expires_at || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        max_uses: invitation.max_uses,
        current_uses: invitation.current_uses,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AlignmentError || error instanceof AuthError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(error);
  }
}
