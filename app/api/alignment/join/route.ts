/**
 * Join Alignment via Invite API Route
 *
 * POST /api/alignment/join
 *
 * Allows a user to join an alignment using a shared invite token.
 * Validates token, checks expiration, usage limits, and adds user as participant.
 *
 * Security:
 * - Token is hashed and compared against database
 * - Rate limiting: 10 attempts per hour per IP address
 * - Validates expiration, invalidation, and usage limits
 * - Prevents duplicate participants
 * - Raw tokens are never logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { hashToken, isValidTokenFormat } from '@/app/lib/invite-tokens';
import { createErrorResponse, ValidationError, AlignmentError, AuthError } from '@/app/lib/errors';

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (reset on server restart)
// For production, consider Redis or similar distributed cache
const joinAttempts = new Map<string, RateLimitEntry>();

/**
 * Check if IP address has exceeded rate limit
 * @param ip - IP address to check
 * @returns true if under limit, false if exceeded
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = joinAttempts.get(ip);

  // No previous attempts or reset time passed
  if (!limit || now > limit.resetAt) {
    joinAttempts.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= 10) {
    return false;
  }

  // Increment counter
  limit.count++;
  return true;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check forwarded headers (from proxies like Vercel)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to direct connection IP
  return request.ip || 'unknown';
}

// ============================================================================
// Request/Response Schema
// ============================================================================

const JoinRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

interface JoinResponse {
  success: true;
  alignment_id: string;
  message: string;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<JoinResponse | { error: unknown }>> {
  const supabase = createServerClient();

  try {
    // 1. Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      throw new AuthError(
        'Too many join attempts. Please try again in an hour.',
        429,
        { ip: clientIP }
      );
    }

    // 2. Authenticate user
    const user = await requireAuth(supabase);

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = JoinRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validationResult.error.format() }
      );
    }

    const { token } = validationResult.data;

    // 4. Validate token format (basic check before hashing)
    if (!isValidTokenFormat(token)) {
      throw new ValidationError(
        'Invalid token format',
        { tokenLength: token.length }
      );
    }

    // 5. Hash token and look up invitation
    const tokenHash = hashToken(token);

    const { data: invitation, error: inviteError } = await supabase
      .from('alignment_invitations')
      .select('id, alignment_id, expires_at, max_uses, current_uses, invalidated_at')
      .eq('token_hash', tokenHash)
      .single();

    if (inviteError || !invitation) {
      throw new ValidationError(
        'Invalid or expired invite link',
        { tokenHash: tokenHash.substring(0, 8) + '...' }
      );
    }

    // 6. Validate invitation status
    const now = new Date();

    // Check if invalidated
    if (invitation.invalidated_at) {
      throw new ValidationError(
        'This invite link has been revoked',
        { invalidatedAt: invitation.invalidated_at }
      );
    }

    // Check if expired
    if (invitation.expires_at) {
      const expiresAt = new Date(invitation.expires_at);
      if (now > expiresAt) {
        throw new ValidationError(
          'This invite link has expired',
          { expiresAt: invitation.expires_at }
        );
      }
    }

    // Check usage limit
    const currentUses = invitation.current_uses ?? 0;
    const maxUses = invitation.max_uses ?? 1;
    if (currentUses >= maxUses) {
      throw new ValidationError(
        'This invite link has reached its usage limit',
        { maxUses, currentUses }
      );
    }

    // 7. Check if user is already a participant
    const { data: existingParticipant, error: participantCheckError } = await supabase
      .from('alignment_participants')
      .select('id')
      .eq('alignment_id', invitation.alignment_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (participantCheckError) {
      console.error('Failed to check existing participant:', participantCheckError);
      throw new Error('Failed to verify participation status');
    }

    if (existingParticipant) {
      throw new AlignmentError(
        'You are already a participant in this alignment',
        'ALREADY_PARTICIPANT',
        409,
        { alignmentId: invitation.alignment_id }
      );
    }

    // 8. Add user as participant with role "partner"
    const { error: insertError } = await supabase
      .from('alignment_participants')
      .insert({
        alignment_id: invitation.alignment_id,
        user_id: user.id,
        role: 'partner',
      });

    if (insertError) {
      console.error('Failed to add participant:', insertError);
      throw new Error('Failed to join alignment');
    }

    // 9. Increment invitation usage counter
    const { error: updateError } = await supabase
      .from('alignment_invitations')
      .update({ current_uses: (invitation.current_uses ?? 0) + 1 })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to update invitation usage:', updateError);
      // Non-fatal - user is already added as participant
    }

    // 10. Return success with alignment ID for redirect
    return NextResponse.json(
      {
        success: true,
        alignment_id: invitation.alignment_id,
        message: 'Successfully joined alignment',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Join alignment error:', error);
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
