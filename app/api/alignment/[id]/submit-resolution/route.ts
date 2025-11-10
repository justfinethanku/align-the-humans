/**
 * Submit Resolution API Endpoint
 *
 * POST /api/alignment/[id]/submit-resolution
 *
 * Saves user's conflict resolutions and coordinates multi-round workflow:
 * - Saves resolutions as alignment_responses
 * - Checks if both partners submitted
 * - Triggers re-analysis if both submitted
 * - Updates alignment status appropriately
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { saveResponse, submitResponse, isParticipant, getRoundResponses, updateAlignmentStatus } from '@/app/lib/db-helpers';
import { AlignmentError, ValidationError, createErrorResponse } from '@/app/lib/errors';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import type { ResponseAnswers } from '@/app/lib/types';

// ============================================================================
// Request Schema
// ============================================================================

const resolutionSchema = z.object({
  conflict_id: z.string(),
  resolution_type: z.enum(['ai_suggestion', 'accept_own', 'accept_partner', 'custom']),
  selected_option: z.string().optional(),
  custom_solution: z.string().optional(),
});

const submitResolutionSchema = z.object({
  round: z.number().int().positive('Round must be a positive integer'),
  resolutions: z.array(resolutionSchema).min(1, 'At least one resolution required'),
});

type SubmitResolutionRequest = z.infer<typeof submitResolutionSchema>;

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await getCurrentUser(supabase);
    if (!user) {
      throw new AlignmentError(
        'Authentication required',
        'AUTH_REQUIRED',
        401
      );
    }

    // 2. Get alignment ID from params
    const { id: alignmentId } = await context.params;

    // 3. Verify user is a participant
    const isUserParticipant = await isParticipant(supabase, alignmentId, user.id);
    if (!isUserParticipant) {
      throw AlignmentError.unauthorized(alignmentId, user.id);
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const { round, resolutions } = submitResolutionSchema.parse(body);

    // 5. Validate custom resolutions have content
    const invalidCustomResolutions = resolutions.filter(
      r => r.resolution_type === 'custom' && !r.custom_solution?.trim()
    );

    if (invalidCustomResolutions.length > 0) {
      throw new ValidationError(
        'Custom resolutions must include a solution',
        { invalidResolutions: invalidCustomResolutions }
      );
    }

    // 6. Get alignment to verify status and round
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('*')
      .eq('id', alignmentId)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(alignmentId);
    }

    // Verify alignment is in resolving status
    if (alignment.status !== 'resolving') {
      throw new AlignmentError(
        `Cannot submit resolutions for alignment in '${alignment.status}' status`,
        'INVALID_STATUS',
        409,
        { currentStatus: alignment.status, expectedStatus: 'resolving' }
      );
    }

    // Verify round matches
    if (alignment.current_round !== round) {
      throw new AlignmentError(
        `Round mismatch. Expected round ${alignment.current_round}, got ${round}`,
        'ROUND_MISMATCH',
        409,
        { currentRound: alignment.current_round, submittedRound: round }
      );
    }

    // 7. Build response answers structure
    const answers = {
      response_version: 1,
      answers: resolutions.reduce((acc, resolution) => {
        acc[resolution.conflict_id] = {
          value: resolution.resolution_type === 'custom'
            ? resolution.custom_solution || ''
            : resolution.resolution_type === 'ai_suggestion'
              ? resolution.selected_option || ''
              : resolution.resolution_type,
          timestamp: new Date().toISOString(),
        };
        return acc;
      }, {} as Record<string, any>),
      metadata: {
        resolution_round: round,
        submission_timestamp: new Date().toISOString(),
      },
    } as any;

    // 8. Save response
    const { error: saveError } = await saveResponse(supabase, {
      alignmentId,
      userId: user.id,
      round,
      answers,
      metadata: {
        resolution_submission: true,
        conflict_count: resolutions.length,
      },
    });

    if (saveError) {
      throw new AlignmentError(
        'Failed to save resolution response',
        'SAVE_ERROR',
        500,
        { alignmentId, round }
      );
    }

    // 9. Submit response (mark as submitted)
    const { error: submitError } = await submitResponse(
      supabase,
      alignmentId,
      user.id,
      round
    );

    if (submitError) {
      throw new AlignmentError(
        'Failed to submit resolution response',
        'SUBMIT_ERROR',
        500,
        { alignmentId, round }
      );
    }

    // 10. Check if both participants have submitted
    const { data: roundResponses, error: responsesError } = await getRoundResponses(
      supabase,
      alignmentId,
      round
    );

    if (responsesError) {
      // Non-critical - log but don't fail
      telemetry.logError({
        errorCode: 'RESPONSES_CHECK_FAILED',
        errorMessage: 'Failed to check if both participants submitted',
        userId: user.id,
        context: { alignmentId, round, responsesError },
      });
    }

    const bothSubmitted = roundResponses && roundResponses.length >= 2;

    // 11. If both submitted, increment round and stay in resolving status
    // The analysis page will handle triggering re-analysis
    if (bothSubmitted) {
      const { error: incrementError } = await supabase
        .from('alignments')
        .update({ current_round: round + 1 })
        .eq('id', alignmentId);

      if (incrementError) {
        telemetry.logError({
          errorCode: 'ROUND_INCREMENT_FAILED',
          errorMessage: 'Failed to increment round',
          userId: user.id,
          context: { alignmentId, round, incrementError },
        });
      }

      const { error: statusUpdateError } = await updateAlignmentStatus(
        supabase,
        alignmentId,
        'analyzing'
      );

      if (statusUpdateError) {
        telemetry.logError({
          errorCode: 'STATUS_UPDATE_FAILED',
          errorMessage: 'Failed to move alignment back to analyzing after resolution',
          userId: user.id,
          context: { alignmentId, round, statusUpdateError },
        });
      }
    }

    // 12. Log successful completion
    const latencyMs = timer.stop();
    telemetry.log(
      'alignment.status.changed' as any,
      user.id,
      {
        alignmentId,
        latencyMs,
        action: 'resolution.submit.complete',
        bothSubmitted,
      }
    );

    // 13. Return success response
    return NextResponse.json({
      data: {
        success: true,
        bothSubmitted,
        nextRound: bothSubmitted ? round + 1 : round,
        message: bothSubmitted
          ? 'Both resolutions submitted. Ready for re-analysis.'
          : 'Your resolutions submitted. Waiting for partner.',
      },
    }, { status: 200 });

  } catch (error) {
    // Log error
    const latencyMs = timer.stop();

    if (error instanceof AlignmentError || error instanceof ValidationError) {
      telemetry.logError({
        errorCode: error.code,
        errorMessage: error.message,
        userId: (await getCurrentUser(supabase))?.id,
        context: { error: error.details },
      });
    } else if (error instanceof z.ZodError) {
      telemetry.logError({
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Invalid request payload',
        userId: (await getCurrentUser(supabase))?.id,
        context: { errors: error.errors },
      });

      return createErrorResponse(
        new ValidationError('Invalid request payload', { errors: error.errors })
      );
    } else {
      telemetry.logError({
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId: (await getCurrentUser(supabase))?.id,
      });
    }

    return createErrorResponse(error);
  }
}

// ============================================================================
// OPTIONS Handler for CORS
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
