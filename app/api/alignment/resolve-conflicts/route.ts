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
import { models, AI_MODELS, resolveModel } from '@/app/lib/ai-config';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import {
  createErrorResponse,
  ValidationError,
  AlignmentError,
  AIError,
  RateLimitError
} from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
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

    // 1b. Rate limit (heavy AI operation): ~10/min/user
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.resolve-conflicts'),
      { limit: 10, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many resolution requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

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
    const promptConfig = await getPrompt('resolve-conflicts');
    const constraintsSection =
      conflict.constraints && conflict.constraints.length > 0
        ? `\n\nConstraints to consider:\n${conflict.constraints.map((c) => `- ${c}`).join('\n')}`
        : '';
    const prompt = renderPrompt(promptConfig.userPromptTemplate, {
      topic: conflict.topic,
      personA: conflict.personA,
      personB: conflict.personB,
      constraintsSection,
    });

    let resolution: ConflictResolution;

    try {
      const { object } = await generateObject({
        model: resolveModel(promptConfig.model) as any,
        schema: ConflictResolutionSchema,
        system: promptConfig.systemPrompt,
        prompt,
        temperature: promptConfig.temperature,
        maxOutputTokens: promptConfig.maxTokens,
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
