/**
 * Regenerate Alignment Invite API Route
 *
 * POST /api/alignment/[id]/regenerate-invite
 *
 * Regenerates an invite link for an alignment, invalidating the previous one.
 * Only the alignment creator can regenerate invites.
 *
 * Use cases:
 * - Previous invite was accidentally shared publicly
 * - Previous invite expired
 * - Need to revoke access before partner joins
 *
 * Security:
 * - Marks old invitation as invalidated (sets invalidated_at timestamp)
 * - Old tokens become immediately unusable
 * - New token is completely independent from old one
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { encryptInviteToken, generateInvite } from '@/app/lib/invite-tokens';
import { createErrorResponse, AlignmentError, AuthError, DatabaseError } from '@/app/lib/errors';

// ============================================================================
// Types
// ============================================================================

interface RegenerateInviteResponse {
  token: string;
  invite_url: string;
  expires_at: string;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<RegenerateInviteResponse | { error: unknown }>> {
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Verify alignment exists and user is the creator
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('id, created_by, current_invite_id')
      .eq('id', params.id)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(params.id);
    }

    if (alignment.created_by !== user.id) {
      throw new AuthError(
        'Only the alignment creator can regenerate invite links',
        403,
        { alignmentId: params.id, userId: user.id }
      );
    }

    // 3. Invalidate current invitation if it exists
    if (alignment.current_invite_id) {
      const { error: invalidateError } = await supabase
        .from('alignment_invitations')
        .update({ invalidated_at: new Date().toISOString() })
        .eq('id', alignment.current_invite_id);

      if (invalidateError) {
        console.error('Failed to invalidate old invitation:', invalidateError);
        // Non-fatal - continue to generate new invitation
      }
    }

    // 4. Generate new secure token
    const { token, hash } = generateInvite();
    const tokenCiphertext = encryptInviteToken(token);

    // 5. Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 6. Insert new invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('alignment_invitations')
      .insert({
        alignment_id: params.id,
        token_hash: hash,
        token_ciphertext: tokenCiphertext,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
        current_uses: 0,
      })
      .select('id, expires_at')
      .single();

    if (insertError || !invitation) {
      console.error('Failed to insert new invitation:', insertError);
      throw new DatabaseError(
        'Failed to regenerate invite link',
        { alignmentId: params.id, error: insertError }
      );
    }

    // 7. Update alignment's current_invite_id to new invitation
    const { error: updateError } = await supabase
      .from('alignments')
      .update({ current_invite_id: invitation.id })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to update alignment current_invite_id:', updateError);
      // Non-fatal - invitation still exists and works
    }

    // 8. Construct shareable URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/join/${token}`;

    // 9. Return response with new token
    return NextResponse.json(
      {
        token,
        invite_url: inviteUrl,
        expires_at: invitation.expires_at || expiresAt.toISOString(),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Regenerate invite error:', error);
    return createErrorResponse(error) as any;
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
