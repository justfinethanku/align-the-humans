/**
 * Generate Alignment Invite API Route
 *
 * POST /api/alignment/[id]/generate-invite
 *
 * Generates a secure invite link for an alignment. Only the alignment creator
 * can generate invites. The raw token is returned only once - it must be
 * shared with the intended partner.
 *
 * Security:
 * - Tokens are cryptographically secure (32 bytes, base64url encoded)
 * - Only SHA-256 hashes are stored in the database
 * - Raw tokens are never logged or stored
 * - Invites expire after 30 days by default
 * - Single-use by default (max_uses = 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { generateInvite } from '@/app/lib/invite-tokens';
import { createErrorResponse, AlignmentError, AuthError, DatabaseError } from '@/app/lib/errors';

// ============================================================================
// Types
// ============================================================================

interface GenerateInviteResponse {
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
): Promise<NextResponse<GenerateInviteResponse | { error: unknown }>> {
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Verify alignment exists and user is the creator
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('id, created_by')
      .eq('id', params.id)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(params.id);
    }

    if (alignment.created_by !== user.id) {
      throw new AuthError(
        'Only the alignment creator can generate invite links',
        403,
        { alignmentId: params.id, userId: user.id }
      );
    }

    // 3. Generate secure token
    const { token, hash } = generateInvite();

    // 4. Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 5. Insert invitation record into database
    const { data: invitation, error: insertError } = await supabase
      .from('alignment_invitations')
      .insert({
        alignment_id: params.id,
        token_hash: hash,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
        current_uses: 0,
      })
      .select('id, expires_at')
      .single();

    if (insertError || !invitation) {
      console.error('Failed to insert invitation:', insertError);
      throw new DatabaseError(
        'Failed to generate invite link',
        { alignmentId: params.id, error: insertError }
      );
    }

    // 6. Update alignment's current_invite_id
    const { error: updateError } = await supabase
      .from('alignments')
      .update({ current_invite_id: invitation.id })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to update alignment current_invite_id:', updateError);
      // Non-fatal - invitation still exists and works
    }

    // 7. Construct shareable URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/join/${token}`;

    // 8. Return response with raw token (only time it's exposed)
    return NextResponse.json(
      {
        token,
        invite_url: inviteUrl,
        expires_at: invitation.expires_at || expiresAt.toISOString(),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Generate invite error:', error);
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
