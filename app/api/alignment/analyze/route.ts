/**
 * AI-Powered Alignment Analysis API Endpoint
 *
 * POST /api/alignment/analyze
 *
 * Analyzes both participants' responses and identifies:
 * - Areas of alignment
 * - Conflicts (with severity levels)
 * - Hidden assumptions
 * - Gaps in discussion
 * - Power imbalances
 *
 * Requirements:
 * - Both participants must have submitted responses
 * - User must be a participant in the alignment
 * - Alignment must be in 'active' or 'resolving' status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { resolveModel } from '@/app/lib/ai-config';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
import { createServerClient, createAdminClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getRoundResponses, saveAnalysis, isParticipant } from '@/app/lib/db-helpers';
import { AlignmentError, ValidationError, RateLimitError, createErrorResponse } from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
import { sendAnalysisCompleteEmail } from '@/app/lib/email-service';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import type { AlignmentAnalysis, AlignmentResponse } from '@/app/lib/types';

// ============================================================================
// Request/Response Schemas
// ============================================================================

const analyzeRequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID format'),
  round: z.number().int().positive('Round must be a positive integer'),
});

const conflictSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  severity: z.enum(['critical', 'moderate', 'minor']),
  topic: z.string(),
  description: z.string(),
  personA_position: z.string(),
  personB_position: z.string(),
  suggested_resolution: z.string().optional(),
  suggestions: z.array(z.string()),
});

const analysisSchema = z.object({
  alignedItems: z.array(z.object({
    question_id: z.string(),
    description: z.string(),
    shared_value: z.string(),
  })),
  conflicts: z.array(conflictSchema),
  hiddenAssumptions: z.array(z.object({
    assumption: z.string(),
    affected_party: z.enum(['personA', 'personB', 'both']),
    impact: z.string(),
  })),
  gaps: z.array(z.object({
    topic: z.string(),
    importance: z.enum(['critical', 'moderate', 'minor']),
    suggested_questions: z.array(z.string()),
  })),
  imbalances: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'moderate', 'minor']),
    mitigation: z.string(),
  })),
  overall_alignment_score: z.number().min(0).max(100),
});

type AnalysisResult = z.infer<typeof analysisSchema>;

const ANALYSIS_LOCK_STALE_AFTER_MS = 5 * 60 * 1000;
const ANALYSIS_RETRY_AFTER_SECONDS = 3;

type SupabaseServerClient = ReturnType<typeof createServerClient>;
type RollbackStatus = 'active' | 'resolving';

function emptyAnalysisPayload(): AnalysisResult {
  return {
    alignedItems: [],
    conflicts: [],
    hiddenAssumptions: [],
    gaps: [],
    imbalances: [],
    overall_alignment_score: 0,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeAnalysisPayload(details: unknown): unknown {
  if (!isObject(details)) {
    return emptyAnalysisPayload();
  }

  const rawOutput = details.raw_output;
  if (typeof rawOutput === 'string') {
    try {
      return JSON.parse(rawOutput);
    } catch {
      return details;
    }
  }

  if (isObject(rawOutput)) {
    return rawOutput;
  }

  return details;
}

async function fetchExistingAnalysis(
  supabase: SupabaseServerClient,
  alignmentId: string,
  round: number
): Promise<AlignmentAnalysis | null> {
  const { data, error } = await supabase
    .from('alignment_analyses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    throw new AlignmentError(
      'Failed to fetch existing analysis',
      'ANALYSIS_FETCH_ERROR',
      500,
      { alignmentId, round }
    );
  }

  return data as AlignmentAnalysis | null;
}

function createCompleteResponse(
  alignmentId: string,
  round: number,
  analysis: AlignmentAnalysis | { details: unknown }
) {
  return NextResponse.json({
    data: {
      status: 'complete',
      inProgress: false,
      alignmentId,
      round,
      analysis: normalizeAnalysisPayload(analysis.details),
    },
  }, { status: 200 });
}

function createInProgressResponse(alignmentId: string, round: number) {
  return NextResponse.json({
    data: {
      status: 'in_progress',
      inProgress: true,
      alignmentId,
      round,
      retryAfterSeconds: ANALYSIS_RETRY_AFTER_SECONDS,
      message: 'Analysis is already in progress.',
    },
  }, {
    status: 202,
    headers: {
      'Retry-After': String(ANALYSIS_RETRY_AFTER_SECONDS),
    },
  });
}

function isRollbackStatus(status: string): status is RollbackStatus {
  return status === 'active' || status === 'resolving';
}

async function ensureAnalysisIsResolving(
  supabase: SupabaseServerClient,
  alignmentId: string,
  round: number,
  userId: string
): Promise<void> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { data: transitioned, error: transitionError } = await supabase
      .from('alignments')
      .update({ status: 'resolving' })
      .eq('id', alignmentId)
      .eq('current_round', round)
      .eq('status', 'analyzing')
      .select('status')
      .maybeSingle();

    if (transitioned?.status === 'resolving') {
      return;
    }

    if (transitionError) {
      lastError = transitionError;
    } else {
      const { data: current, error: currentError } = await supabase
        .from('alignments')
        .select('status,current_round')
        .eq('id', alignmentId)
        .single();

      if (!currentError && current?.current_round === round &&
          (current.status === 'resolving' || current.status === 'complete')) {
        return;
      }

      lastError = currentError || new Error(
        `Alignment remained in '${current?.status || 'unknown'}' after analysis was saved.`
      );
    }

    telemetry.logError({
      errorCode: 'ANALYSIS_STATUS_TRANSITION_RETRY',
      errorMessage: `Analysis status transition attempt ${attempt} failed`,
      userId,
      context: { alignmentId, round, attempt },
    });
  }

  throw new AlignmentError(
    'Analysis was saved, but the alignment could not advance to resolution. Please retry.',
    'ANALYSIS_STATUS_TRANSITION_ERROR',
    503,
    {
      alignmentId,
      round,
      cause: lastError instanceof Error ? lastError.message : String(lastError),
    }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  let lockAcquired = false;
  let rollbackStatus: RollbackStatus | null = null;
  let rollbackAlignmentId: string | null = null;
  let rollbackRound: number | null = null;
  let telemetryUserId: string | undefined;

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
    telemetryUserId = user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const { alignmentId, round } = analyzeRequestSchema.parse(body);

    // 3. Verify user is a participant
    const isUserParticipant = await isParticipant(supabase, alignmentId, user.id);
    if (!isUserParticipant) {
      throw AlignmentError.unauthorized(alignmentId, user.id);
    }

    // 4. Fetch alignment to check status and stale-lock age
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('id,status,current_round,updated_at,title')
      .eq('id', alignmentId)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(alignmentId);
    }

    if (round !== alignment.current_round) {
      throw new AlignmentError(
        'Cannot analyze a non-current round.',
        'ROUND_MISMATCH',
        409,
        {
          currentRound: alignment.current_round,
          requestedRound: round,
        }
      );
    }

    const existingAnalysis = await fetchExistingAnalysis(supabase, alignmentId, round);
    if (existingAnalysis) {
      if (alignment.status === 'analyzing') {
        await ensureAnalysisIsResolving(supabase, alignmentId, round, user.id);
      }
      return createCompleteResponse(alignmentId, round, existingAnalysis);
    }

    let effectiveStatus = alignment.status;

    if (effectiveStatus === 'analyzing') {
      const staleCutoff = new Date(Date.now() - ANALYSIS_LOCK_STALE_AFTER_MS).toISOString();
      const isStale =
        new Date(alignment.updated_at).getTime() < Date.now() - ANALYSIS_LOCK_STALE_AFTER_MS;

      if (!isStale) {
        return createInProgressResponse(alignmentId, round);
      }

      const recoveredStatus: RollbackStatus =
        alignment.current_round > 1 ? 'resolving' : 'active';
      const { data: recoveredLock, error: recoveryError } = await supabase
        .from('alignments')
        .update({ status: recoveredStatus })
        .eq('id', alignmentId)
        .eq('status', 'analyzing')
        .eq('current_round', round)
        .lt('updated_at', staleCutoff)
        .select('id,status')
        .maybeSingle();

      if (recoveryError) {
        throw new AlignmentError(
          'Failed to recover stale analysis lock',
          'ANALYSIS_STALE_RECOVERY_ERROR',
          500,
          { alignmentId, round }
        );
      }

      if (!recoveredLock) {
        const recoveredAnalysis = await fetchExistingAnalysis(supabase, alignmentId, round);
        if (recoveredAnalysis) {
          return createCompleteResponse(alignmentId, round, recoveredAnalysis);
        }

        return createInProgressResponse(alignmentId, round);
      }

      effectiveStatus = recoveredStatus;
    }

    if (!isRollbackStatus(effectiveStatus)) {
      throw new AlignmentError(
        `Cannot analyze alignment in '${alignment.status}' status.`,
        'INVALID_STATUS',
        409,
        {
          currentStatus: alignment.status,
          expectedStatus: 'active_resolving_or_analyzing_in_progress',
        }
      );
    }

    // Rate limit only requests that may perform the heavy AI operation.
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.analyze'),
      { limit: 10, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many analysis requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Atomically transition to 'analyzing' to prevent duplicate analyses.
    const { data: lockResult, error: lockError } = await supabase
      .from('alignments')
      .update({ status: 'analyzing' })
      .eq('id', alignmentId)
      .eq('current_round', round)
      .in('status', ['active', 'resolving'])
      .select('id,status')
      .maybeSingle();

    if (lockError) {
      throw new AlignmentError(
        'Failed to acquire analysis lock',
        'ANALYSIS_LOCK_ERROR',
        500,
        { alignmentId, round }
      );
    }

    if (!lockResult) {
      const completedAnalysis = await fetchExistingAnalysis(supabase, alignmentId, round);
      if (completedAnalysis) {
        await ensureAnalysisIsResolving(supabase, alignmentId, round, user.id);
        return createCompleteResponse(alignmentId, round, completedAnalysis);
      }

      return createInProgressResponse(alignmentId, round);
    }

    lockAcquired = true;
    rollbackStatus = effectiveStatus;
    rollbackAlignmentId = alignmentId;
    rollbackRound = round;

    // 5. Fetch both participants' responses
    const { data: responses, error: responsesError } = await getRoundResponses(
      supabase,
      alignmentId,
      round
    );

    if (responsesError || !responses) {
      throw new AlignmentError(
        'Failed to fetch responses',
        'RESPONSES_FETCH_ERROR',
        500,
        { alignmentId, round }
      );
    }

    // 6. Validate that both participants have submitted
    if (responses.length < 2) {
      const submittedUserIds = responses.map(r => r.user_id);
      throw AlignmentError.incompleteParticipation(
        alignmentId,
        submittedUserIds[0] || 'unknown'
      );
    }

    if (responses.length > 2) {
      throw new AlignmentError(
        'More than 2 participants detected. Currently only supporting 2-party alignments.',
        'TOO_MANY_PARTICIPANTS',
        400,
        { participantCount: responses.length }
      );
    }

    const personAUserId = responses[0].user_id;
    const personBUserId = responses[1].user_id;

    // 7. Log start of AI analysis
    const promptConfig = await getPrompt('analyze-responses');

    telemetry.logAIOperation({
      event: 'ai.analysis.start',
      alignmentId,
      latencyMs: 0,
      model: promptConfig.model,
      success: true,
      userId: user.id,
    });

    // 8. Perform AI analysis
    const analysis = await analyzeResponses(responses, alignmentId);

    // 9. Save analysis to database
    const { error: saveError } = await saveAnalysis(supabase, {
      alignmentId,
      round,
      summary: {
        alignment_score: analysis.overall_alignment_score,
        conflicts: analysis.conflicts.map(c => ({
          question_id: c.question_id,
          severity: c.severity,
          description: c.description,
          user1_response: c.personA_position,
          user2_response: c.personB_position,
          suggested_resolution: c.suggested_resolution,
        })),
        agreements: analysis.alignedItems.map(a => ({
          question_id: a.question_id,
          description: a.description,
          shared_value: a.shared_value,
        })),
        recommendations: [
          ...analysis.gaps.map(g => `Gap: ${g.topic}`),
          ...analysis.imbalances.map(i => `Imbalance: ${i.description}`),
        ],
      },
      details: {
        model: promptConfig.model,
        prompt_tokens: 0, // Will be populated from usage if available
        completion_tokens: 0,
        raw_output: JSON.stringify(analysis),
        personAUserId,
        personBUserId,
        conflicts_detailed: analysis.conflicts.map(c => ({
          question_id: c.question_id,
          severity: c.severity,
          description: c.description,
          user1_response: c.personA_position,
          user2_response: c.personB_position,
          suggested_resolution: c.suggested_resolution,
          resolution_strategies: c.suggestions,
          compromise_options: c.suggestions,
          impact_assessment: `${c.severity} severity conflict`,
        })),
        processing_time_ms: timer.getLatency(),
        hidden_assumptions: analysis.hiddenAssumptions,
        gaps: analysis.gaps,
        imbalances: analysis.imbalances,
      },
      createdBy: user.id,
    });

    if (saveError) {
      if ((saveError as { code?: string }).code === '23505') {
        const completedAnalysis = await fetchExistingAnalysis(supabase, alignmentId, round);
        if (completedAnalysis) {
          lockAcquired = false;
          await ensureAnalysisIsResolving(supabase, alignmentId, round, user.id);
          return createCompleteResponse(alignmentId, round, completedAnalysis);
        }
      }

      throw new AlignmentError(
        'Failed to save analysis',
        'ANALYSIS_SAVE_ERROR',
        500,
        { alignmentId, round }
      );
    }

    // 10. Once persistence succeeds, leave an analyzing status in place if
    // transition attempts fail so the next request can repair it from cache.
    lockAcquired = false;
    await ensureAnalysisIsResolving(supabase, alignmentId, round, user.id);

    // 11. Log successful completion and send email notifications
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.analysis.complete',
      alignmentId,
      latencyMs,
      model: promptConfig.model,
      success: true,
      userId: user.id,
    });

    // Send analysis complete emails (fire-and-forget)
    (async () => {
      try {
        const adminClient = createAdminClient();
        const { data: participants } = await supabase
          .from('alignment_participants')
          .select('user_id')
          .eq('alignment_id', alignmentId);

        if (!participants) return;

        for (const p of participants) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', p.user_id)
            .single();

          const { data: authUser } = await adminClient.auth.admin.getUserById(p.user_id);
          const email = authUser?.user?.email;
          if (!email) continue;

          await sendAnalysisCompleteEmail({
            to: email,
            recipientName: profile?.display_name || 'there',
            alignmentTitle: alignment.title || 'your alignment',
            alignmentId,
            alignmentScore: analysis.overall_alignment_score,
            conflictCount: analysis.conflicts.length,
            agreementCount: analysis.alignedItems.length,
          });
        }
      } catch (emailErr) {
        console.error('[Email] Failed to send analysis emails:', emailErr);
      }
    })();

    // 12. Return analysis results
    return NextResponse.json({
      data: {
        status: 'complete',
        inProgress: false,
        alignmentId,
        round,
        analysis: {
          alignedItems: analysis.alignedItems,
          conflicts: analysis.conflicts,
          hiddenAssumptions: analysis.hiddenAssumptions,
          gaps: analysis.gaps,
          imbalances: analysis.imbalances,
          overall_alignment_score: analysis.overall_alignment_score,
        },
      },
    }, { status: 200 });

  } catch (error) {
    if (lockAcquired && rollbackAlignmentId && rollbackRound && rollbackStatus) {
      const { error: rollbackError } = await supabase
        .from('alignments')
        .update({ status: rollbackStatus })
        .eq('id', rollbackAlignmentId)
        .eq('status', 'analyzing')
        .eq('current_round', rollbackRound);

      if (rollbackError) {
        telemetry.logError({
          errorCode: 'ANALYSIS_ROLLBACK_FAILED',
          errorMessage: rollbackError.message,
          userId: undefined,
          context: {
            alignmentId: rollbackAlignmentId,
            round: rollbackRound,
            rollbackStatus,
          },
        });
      }
    }

    // Log error with telemetry
    if (error instanceof AlignmentError || error instanceof ValidationError) {
      telemetry.logError({
        errorCode: error.code,
        errorMessage: error.message,
        userId: telemetryUserId,
        context: { error: error.details },
      });
    } else {
      telemetry.logError({
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId: telemetryUserId,
      });
    }

    return createErrorResponse(error);
  }
}

// ============================================================================
// AI Analysis Function
// ============================================================================

async function analyzeResponses(
  responses: AlignmentResponse[],
  alignmentId: string
): Promise<AnalysisResult> {
  const [responseA, responseB] = responses;

  // Load prompt config from DB/seeds (model, temperature, maxTokens are admin-configurable)
  const promptConfig = await getPrompt('analyze-responses');

  // Round 2+ analyses include resolution context and reliably exceed 8k output
  // tokens; a low admin-configured cap truncates the JSON mid-object and every
  // analysis fails with a parse error. 16384 is the empirically verified value
  // (8192 fails, 16384 succeeds on real round-2 payloads). Config stays
  // authoritative above the floor, but never below it.
  const ANALYZE_MAX_TOKENS_FLOOR = 16384;
  if ((promptConfig.maxTokens ?? 0) < ANALYZE_MAX_TOKENS_FLOOR) {
    console.warn(
      JSON.stringify({
        event: 'analyze.max_tokens_floor_engaged',
        alignmentId,
        configuredMaxTokens: promptConfig.maxTokens,
        floor: ANALYZE_MAX_TOKENS_FLOOR,
      })
    );
    promptConfig.maxTokens = ANALYZE_MAX_TOKENS_FLOOR;
  }

  // Render the DB-managed analysis template with both participants' answers
  const prompt = renderPrompt(promptConfig.userPromptTemplate, {
    responseA: JSON.stringify(responseA.answers, null, 2),
    responseB: JSON.stringify(responseB.answers, null, 2),
  });

  try {
    const result = await generateObject({
      model: resolveModel(promptConfig.model) as any,
      schema: analysisSchema,
      system: promptConfig.systemPrompt,
      prompt,
      temperature: promptConfig.temperature,
      maxOutputTokens: promptConfig.maxTokens,
    });

    return result.object;
  } catch (error) {
    // Log AI-specific error
    telemetry.logAIOperation({
      event: 'ai.analysis.error',
      alignmentId,
      latencyMs: 0,
      model: promptConfig.model,
      success: false,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      errorMessage: error instanceof Error ? error.message : 'AI analysis failed',
    });

    throw new AlignmentError(
      'AI analysis failed. Please try again.',
      'AI_ANALYSIS_FAILED',
      502,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
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
