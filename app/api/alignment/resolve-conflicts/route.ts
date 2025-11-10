/**
 * Conflict Resolution API Endpoint
 *
 * Generates AI-powered compromise suggestions for conflicts between partners.
 * Uses Claude Sonnet 4.5 via Vercel AI SDK to analyze positions and suggest
 * practical middle-ground options with pros/cons and next steps.
 *
 * POST /api/alignment/resolve-conflicts
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
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
 * Creates a detailed prompt for conflict resolution with compromise generation
 */
function createResolutionPrompt(conflict: RequestBody['conflict']): string {
  const constraintsSection = conflict.constraints && conflict.constraints.length > 0
    ? `\n\nConstraints to consider:\n${conflict.constraints.map(c => `- ${c}`).join('\n')}`
    : '';

  return `You are an expert mediator helping two partners reach a compromise on a disagreement.

CONFLICT DETAILS:
Topic: ${conflict.topic}
Person A's Position: ${conflict.personA}
Person B's Position: ${conflict.personB}${constraintsSection}

YOUR TASK:
Generate 3-4 practical compromise options that balance both positions fairly. Each option should:
1. Find genuine middle ground (not just "try harder" or "talk more")
2. Be specific and actionable (include concrete details)
3. Consider both parties' core needs and concerns
4. Be realistic and implementable
5. Include clear next steps for execution

For each compromise option, provide:
- A clear summary of the compromise approach
- Specific pros (benefits, what this achieves)
- Specific cons (trade-offs, potential challenges)
- Actionable next steps (3-5 concrete actions to implement this)

Additionally, provide:
- 2-3 implications: What choosing any of these compromises means for their relationship/project
- 2-3 examples: Real-world precedents or similar situations where comparable compromises worked

IMPORTANT GUIDELINES:
- Be balanced: Don't favor one position over the other
- Be practical: Focus on what can actually be done
- Be specific: Avoid vague suggestions like "communicate better"
- Be empathetic: Acknowledge the difficulty of compromising
- Consider context: Account for constraints if provided
- Think long-term: Consider sustainability of each option

Generate options that show respect for both positions while finding creative solutions.`;
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
      model: 'claude-sonnet-4.5',
      success: true,
      userId: user.id,
    });

    // 5. Generate compromise suggestions using Claude
    const prompt = createResolutionPrompt(conflict);

    let resolution: ConflictResolution;

    try {
      const { object } = await generateObject({
        model: anthropic('claude-sonnet-4-5-20250929'),
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
      model: 'claude-sonnet-4.5',
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
        model: 'claude-sonnet-4.5',
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
