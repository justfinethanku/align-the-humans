/**
 * Solution Discovery API Endpoint
 *
 * Generates AI-powered solution suggestions by synthesizing both perspectives.
 * Uses Claude Sonnet 4.5 via Vercel AI SDK to analyze independent thinking and discover
 * new options that emerge from collaborative intelligence - not simple compromise.
 *
 * POST /api/alignment/resolve-conflicts
 */

import { generateObject } from 'ai';
import { models, AI_MODELS } from '@/app/lib/ai-config';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import {
  createErrorResponse,
  ValidationError,
  AlignmentError,
  AIError
} from '@/app/lib/errors';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Request body validation schema
 */
const RequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID format'),
  conflict: z.object({
    topic: z.string().min(1, 'Conflict topic is required'),
    personA: z.string().min(1, 'Person A position is required'),
    personB: z.string().min(1, 'Person B position is required'),
    constraints: z.array(z.string()).optional().default([]),
  }),
});

type RequestBody = z.infer<typeof RequestSchema>;

/**
 * Compromise option structure
 */
const CompromiseOptionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

/**
 * AI response structure for conflict resolution
 */
const ConflictResolutionSchema = z.object({
  options: z.array(CompromiseOptionSchema).min(3).max(4),
  implications: z.array(z.string()).min(2),
  examples: z.array(z.string()).min(2),
});

type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;
type CompromiseOption = z.infer<typeof CompromiseOptionSchema>;

// ============================================================================
// Prompt Engineering
// ============================================================================

/**
 * Creates a detailed prompt for solution discovery through synthesis
 */
function createResolutionPrompt(conflict: RequestBody['conflict']): string {
  const constraintsSection = conflict.constraints && conflict.constraints.length > 0
    ? `\n\nConstraints to consider:\n${conflict.constraints.map(c => `- ${c}`).join('\n')}`
    : '';

  return `You are an expert facilitator helping two people discover new solutions by synthesizing their independent thinking.

DECISION DETAILS:
Topic: ${conflict.topic}
Person A's Perspective: ${conflict.personA}
Person B's Perspective: ${conflict.personB}${constraintsSection}

YOUR TASK:
Analyze both perspectives deeply to discover 3-4 solutions that neither person may have considered alone. These should NOT be simple compromises - look for:

1. Synthesis opportunities: Where both perspectives reveal a third option neither suggested
2. Hidden shared values: What both people actually want underneath their stated positions
3. False dichotomies: Are they treating this as either/or when it could be both/and?
4. Unstated assumptions: What are they each assuming that might not be true?
5. Creative reframes: Is there a different way to think about this decision entirely?

For each discovered solution, provide:
- A clear summary of the solution (what makes it different from simple compromise)
- Specific pros (benefits, what this achieves for both people)
- Specific cons (trade-offs, potential challenges)
- Actionable next steps (3-5 concrete actions to implement this)

Additionally, provide:
- 2-3 implications: What discovering any of these solutions reveals about their shared priorities
- 2-3 examples: Real-world precedents where similar synthesis approaches worked

IMPORTANT GUIDELINES:
- Seek discovery, not compromise: Don't just split the difference
- Look beneath positions: What do they each actually need/value?
- Be specific: Avoid vague suggestions like "communicate better"
- Honor both perspectives: Show how each person's thinking contributed to the discovery
- Consider context: Account for constraints if provided
- Think generatively: What new possibilities emerge from combining their insights?

Generate solutions that demonstrate collaborative intelligence - options better than either person imagined alone.`;
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST handler for conflict resolution
 */
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = RequestSchema.safeParse(body);

    if (!validatedData.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validatedData.error.errors }
      );
    }

    const { alignmentId, conflict } = validatedData.data;

    // 3. Verify user has access to this alignment
    const { data: participantCheck, error: participantError } = await supabase
      .from('alignment_participants')
      .select('id')
      .eq('alignment_id', alignmentId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participantCheck) {
      throw AlignmentError.unauthorized(alignmentId, user.id);
    }

    // 4. Log AI operation start
    telemetry.logAIOperation({
      event: 'ai.resolve.start',
      alignmentId,
      latencyMs: 0,
      model: AI_MODELS.SONNET,
      success: true,
      userId: user.id,
    });

    // 5. Generate compromise suggestions using Claude
    const prompt = createResolutionPrompt(conflict);

    let resolution: ConflictResolution;

    try {
      const { object } = await generateObject({
        model: models.sonnet as any,
        schema: ConflictResolutionSchema,
        prompt,
        temperature: 0.7, // Higher temperature for creative compromise generation
      });

      resolution = object;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown AI error';

      // Check for rate limiting
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        throw AIError.rateLimitExceeded();
      }

      throw AIError.generationFailed('conflict resolution', errorMessage);
    }

    // 6. Validate AI response
    if (!resolution.options || resolution.options.length < 3) {
      throw AIError.generationFailed(
        'conflict resolution',
        'AI failed to generate sufficient compromise options'
      );
    }

    // 7. Log successful completion
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.resolve.complete',
      alignmentId,
      latencyMs,
      model: AI_MODELS.SONNET,
      success: true,
      userId: user.id,
    });

    // 8. Return structured response
    return Response.json(
      {
        data: {
          options: resolution.options,
          implications: resolution.implications,
          examples: resolution.examples,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Log error event
    const latencyMs = timer.stop();

    if (error instanceof AIError) {
      telemetry.logAIOperation({
        event: 'ai.resolve.error',
        alignmentId: 'unknown',
        latencyMs,
        model: AI_MODELS.SONNET,
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      });
    }

    return createErrorResponse(error);
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type { CompromiseOption, ConflictResolution };
