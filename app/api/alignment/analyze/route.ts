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
 * - Alignment must be in 'active' status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getRoundResponses, saveAnalysis, updateAlignmentStatus, isParticipant } from '@/app/lib/db-helpers';
import { AlignmentError, ValidationError, createErrorResponse } from '@/app/lib/errors';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import type { AlignmentResponse } from '@/app/lib/types';

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

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
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

    // 2. Parse and validate request body
    const body = await request.json();
    const { alignmentId, round } = analyzeRequestSchema.parse(body);

    // 3. Verify user is a participant
    const isUserParticipant = await isParticipant(supabase, alignmentId, user.id);
    if (!isUserParticipant) {
      throw AlignmentError.unauthorized(alignmentId, user.id);
    }

    // 4. Fetch alignment to check status
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('*')
      .eq('id', alignmentId)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(alignmentId);
    }

    // Verify alignment is in correct status
    if (alignment.status !== 'active') {
      throw new AlignmentError(
        `Cannot analyze alignment in '${alignment.status}' status. Must be 'active'.`,
        'INVALID_STATUS',
        409,
        { currentStatus: alignment.status, expectedStatus: 'active' }
      );
    }

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

    // 7. Log start of AI analysis
    telemetry.logAIOperation({
      event: 'ai.analysis.start',
      alignmentId,
      latencyMs: 0,
      model: 'claude-sonnet-4-5-20250929',
      success: true,
      userId: user.id,
    });

    // 8. Perform AI analysis
    const analysis = await analyzeResponses(responses, alignmentId);

    // 9. Save analysis to database
    const { data: savedAnalysis, error: saveError } = await saveAnalysis(supabase, {
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
        model: 'claude-sonnet-4-5-20250929',
        prompt_tokens: 0, // Will be populated from usage if available
        completion_tokens: 0,
        raw_output: JSON.stringify(analysis),
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
      throw new AlignmentError(
        'Failed to save analysis',
        'ANALYSIS_SAVE_ERROR',
        500,
        { alignmentId, round }
      );
    }

    // 10. Update alignment status to 'analyzing'
    const { error: statusError } = await updateAlignmentStatus(
      supabase,
      alignmentId,
      'analyzing'
    );

    if (statusError) {
      // Non-critical - log but don't fail
      telemetry.logError({
        errorCode: 'STATUS_UPDATE_FAILED',
        errorMessage: 'Failed to update alignment status to analyzing',
        userId: user.id,
        context: { alignmentId, statusError },
      });
    }

    // 11. Log successful completion
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.analysis.complete',
      alignmentId,
      latencyMs,
      model: 'claude-sonnet-4-5-20250929',
      success: true,
      userId: user.id,
    });

    // 12. Return analysis results
    return NextResponse.json({
      data: {
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
    // Log error with telemetry
    if (error instanceof AlignmentError || error instanceof ValidationError) {
      telemetry.logError({
        errorCode: error.code,
        errorMessage: error.message,
        userId: (await getCurrentUser(supabase))?.id,
        context: { error: error.details },
      });
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
// AI Analysis Function
// ============================================================================

async function analyzeResponses(
  responses: AlignmentResponse[],
  alignmentId: string
): Promise<AnalysisResult> {
  const [responseA, responseB] = responses;

  // Build comprehensive prompt
  const prompt = `You are analyzing two people's responses to alignment questions. Your goal is to identify areas of agreement, conflicts, hidden assumptions, gaps, and power imbalances.

**Person A's Responses:**
${JSON.stringify(responseA.answers, null, 2)}

**Person B's Responses:**
${JSON.stringify(responseB.answers, null, 2)}

Analyze these responses thoroughly and provide:

1. **ALIGNED ITEMS**: Areas where they completely agree. Be specific about what they agree on and why it's significant.

2. **CONFLICTS**: Disagreements or misalignments. Categorize each by severity:
   - **critical**: Fundamental disagreements that could prevent alignment
   - **moderate**: Important differences that need resolution
   - **minor**: Small differences that can be easily addressed

   For each conflict:
   - Identify the specific question/topic
   - Clearly state each person's position
   - Provide 2-3 concrete suggestions for resolution

3. **HIDDEN ASSUMPTIONS**: Things one person assumes that the other hasn't addressed. These are often unstated expectations that could cause future problems.

4. **GAPS**: Important topics that NEITHER person has adequately addressed. Suggest questions they should consider.

5. **IMBALANCES**: Structural issues in the relationship that could cause problems:
   - Power imbalances
   - Unequal contributions or expectations
   - One-sided arrangements
   - Lack of reciprocity

6. **OVERALL ALIGNMENT SCORE**: A score from 0-100 indicating overall alignment level.
   - 90-100: Excellent alignment, minor refinement needed
   - 70-89: Good alignment, some important conflicts to resolve
   - 50-69: Moderate alignment, significant work needed
   - 30-49: Poor alignment, fundamental disagreements
   - 0-29: Very poor alignment, may need to reconsider

Be thorough, specific, and actionable in your analysis. Focus on helping both parties understand each other's perspectives and find common ground.`;

  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929') as any,
      schema: analysisSchema,
      prompt,
      temperature: 0.3, // Lower temperature for analytical consistency
    });

    return result.object;
  } catch (error) {
    // Log AI-specific error
    telemetry.logAIOperation({
      event: 'ai.analysis.error',
      alignmentId,
      latencyMs: 0,
      model: 'claude-sonnet-4-5-20250929',
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
