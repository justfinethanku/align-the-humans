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
import { saveResponse, submitResponse, isParticipant, getRoundResponses } from '@/app/lib/db-helpers';
import { AlignmentError, ValidationError, createErrorResponse } from '@/app/lib/errors';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import { MAX_RESOLUTION_ROUNDS } from '@/app/lib/resolution-config';

// ============================================================================
// Request Schema
// ============================================================================

const resolutionSchema = z.object({
  conflict_id: z.string(),
  resolution_type: z.enum(['ai_suggestion', 'accept_own', 'accept_partner', 'custom']),
  selected_option: z.string().optional(),
  custom_solution: z.string().optional(),
}).superRefine((resolution, ctx) => {
  if (resolution.resolution_type === 'ai_suggestion' && !resolution.selected_option?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['selected_option'],
      message: 'AI suggestion resolutions must include a selected option',
    });
  }

  if (resolution.resolution_type === 'custom' && !resolution.custom_solution?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['custom_solution'],
      message: 'Custom resolutions must include a solution',
    });
  }
});

const submitResolutionSchema = z.object({
  round: z.number().int().positive('Round must be a positive integer'),
  resolutions: z.array(resolutionSchema).min(1, 'At least one resolution required'),
});

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

    const responseRound = round + 1;

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
        response_round: responseRound,
        submission_timestamp: new Date().toISOString(),
      },
    } as any;

    // 8. Save resolution picks as the next round's analysis input. This keeps
    // them separate from the original questionnaire answers for the current round.
    const { error: saveError } = await saveResponse(supabase, {
      alignmentId,
      userId: user.id,
      round: responseRound,
      answers,
      metadata: {
        resolution_submission: true,
        resolution_round: round,
        response_round: responseRound,
        conflict_count: resolutions.length,
      },
    });

    if (saveError) {
      throw new AlignmentError(
        'Failed to save resolution response',
        'SAVE_ERROR',
        500,
        { alignmentId, round, responseRound }
      );
    }

    // 9. Submit response (mark as submitted)
    const { error: submitError } = await submitResponse(
      supabase,
      alignmentId,
      user.id,
      responseRound
    );

    if (submitError) {
      throw new AlignmentError(
        'Failed to submit resolution response',
        'SUBMIT_ERROR',
        500,
        { alignmentId, round, responseRound }
      );
    }

    // 10. Check if both participants have submitted resolution picks
    const { data: roundResponses, error: responsesError } = await getRoundResponses(
      supabase,
      alignmentId,
      responseRound
    );

    if (responsesError) {
      // Non-critical - log but don't fail
      telemetry.logError({
        errorCode: 'RESPONSES_CHECK_FAILED',
        errorMessage: 'Failed to check if both participants submitted',
        userId: user.id,
        context: { alignmentId, round, responseRound, responsesError },
      });
    }

    const resolutionResponses = (roundResponses || []).filter((response) => {
      const metadata = response.metadata as Record<string, unknown> | null;
      return metadata?.resolution_submission === true && metadata?.resolution_round === round;
    });
    const bothSubmitted = resolutionResponses.length >= 2;

    // 11. If both submitted and the round cap has not been reached, increment
    // round and stay in resolving status. The analysis page will handle
    // triggering re-analysis.
    //
    // If both submitted but this round is already at MAX_RESOLUTION_ROUNDS,
    // do NOT start another round: leave current_round and status untouched
    // (status stays 'resolving', current_round stays at the cap). This is
    // the authoritative circuit breaker for the analyze <-> resolve loop --
    // combined with the next-round resolution response rows, "current_round
    // === MAX_RESOLUTION_ROUNDS and both partners have submitted resolution
    // picks for that analysis round" is the durable signal the UI uses to
    // detect this terminal state, without requiring a new alignments status
    // value or schema change.
    const maxRoundsReached = round >= MAX_RESOLUTION_ROUNDS;

    if (bothSubmitted && !maxRoundsReached) {
      const { error: incrementError } = await supabase
        .from('alignments')
        .update({ current_round: responseRound })
        .eq('id', alignmentId);

      if (incrementError) {
        telemetry.logError({
          errorCode: 'ROUND_INCREMENT_FAILED',
          errorMessage: 'Failed to increment round',
          userId: user.id,
          context: { alignmentId, round, responseRound, incrementError },
        });
      }
    } else if (bothSubmitted && maxRoundsReached) {
      telemetry.log(
        'alignment.status.changed' as any,
        user.id,
        {
          alignmentId,
          action: 'resolution.max_rounds_reached',
          round,
          responseRound,
          maxRounds: MAX_RESOLUTION_ROUNDS,
        }
      );
    }

    const cappedOut = bothSubmitted && maxRoundsReached;

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
        cappedOut,
        responseRound,
      }
    );

    // 13. Return success response
    return NextResponse.json({
      data: {
        success: true,
        bothSubmitted,
        maxRoundsReached: cappedOut,
        currentRound: round,
        maxRounds: MAX_RESOLUTION_ROUNDS,
        nextRound: bothSubmitted && !cappedOut ? responseRound : round,
        message: cappedOut
          ? `You've reached the maximum number of resolution rounds (${MAX_RESOLUTION_ROUNDS}). This alignment needs manual resolution -- review your current areas of agreement or start a new alignment.`
          : bothSubmitted
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
