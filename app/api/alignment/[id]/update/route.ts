/**
 * Alignment Update API Route
 *
 * PATCH /api/alignment/[id]/update
 *
 * Updates alignment fields (title, status, etc.)
 * Used by clarity form for auto-save functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { updateAlignment } from '@/app/lib/db-helpers';
import { createErrorResponse, ValidationError, AlignmentError } from '@/app/lib/errors';

// ============================================================================
// Request/Response Schema
// ============================================================================

const UpdateRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z.enum(['draft', 'active', 'analyzing', 'resolving', 'complete']).optional(),
  current_round: z.number().int().positive().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validationResult.error.format() }
      );
    }

    const updates = validationResult.data;

    // 3. Verify user is a participant in the alignment
    const { data: participant, error: participantError } = await supabase
      .from('alignment_participants')
      .select('id')
      .eq('alignment_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      throw AlignmentError.unauthorized(params.id, user.id);
    }

    // 4. Update alignment
    const { data: alignment, error: updateError } = await updateAlignment(
      supabase,
      params.id,
      updates
    );

    if (updateError || !alignment) {
      throw new Error('Failed to update alignment');
    }

    // 5. Return updated alignment
    return NextResponse.json(
      {
        data: {
          alignment,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Alignment update error:', error);
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
