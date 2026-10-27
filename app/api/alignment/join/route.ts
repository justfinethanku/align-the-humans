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
 * - Rate limiting: 10 attempts per hour per IP address, shared across instances
 * - Validates expiration, invalidation, and usage limits
 * - Prevents duplicate participants
 * - Raw tokens are never logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { hashToken, isValidTokenFormat } from '@/app/lib/invite-tokens';
import {
  createErrorResponse,
  ValidationError,
  AlignmentError,
  AuthError,
  RateLimitError,
} from '@/app/lib/errors';
import { checkRateLimit, clientIpFromForwarded } from '@/app/lib/rate-limit';

const JOIN_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 } as const;

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
  const supabase = await createServerClient();

  try {
    // 1. Rate limiting check (before auth, so token guessing is capped per IP)
    const clientIP = clientIpFromForwarded(
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip')
    );
    const rateLimitResult = await checkRateLimit(
      `ip:${clientIP}:alignment.join`,
      JOIN_RATE_LIMIT
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError(
        'Too many join attempts. Please try again in an hour.',
        { retryAfter: rateLimitResult.retryAfter }
      );
    }

    // 2. Authenticate user
    await requireAuth(supabase);

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

    // 5. Hash token and redeem invitation atomically
    const tokenHash = hashToken(token);
    const { data, error: redeemError } = await supabase.rpc(
      'redeem_alignment_invite',
      { p_token_hash: tokenHash }
    );
    const result = data?.[0];

    if (redeemError || !result) {
      console.error('Failed to redeem invite:', redeemError);
      throw new Error('Failed to join alignment');
    }

    if (!result.ok) {
      switch (result.code) {
        case 'unauthorized':
          throw new AuthError('Please log in to join this alignment');
        case 'not_found':
          throw new ValidationError(
            'Invalid or expired invite link',
            { tokenHash: tokenHash.substring(0, 8) + '...' }
          );
        case 'revoked':
          throw new ValidationError('This invite link has been revoked');
        case 'expired':
          throw new ValidationError('This invite link has expired');
        case 'used':
          throw new ValidationError('This invite link has reached its usage limit');
        case 'closed':
          throw new AlignmentError(
            'This alignment has been completed',
            'ALIGNMENT_CLOSED',
            409
          );
        default:
          throw new Error('Failed to join alignment');
      }
    }

    if (!result.alignment_id) {
      throw new Error('Failed to join alignment');
    }

    // 6. Return success with alignment ID for redirect
    return NextResponse.json(
      {
        success: true,
        alignment_id: result.alignment_id,
        message: result.code === 'already_participant'
          ? 'Already joined alignment'
          : 'Successfully joined alignment',
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
