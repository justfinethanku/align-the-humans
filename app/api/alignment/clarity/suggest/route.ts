/**
 * Clarity Suggestions API Route
 *
 * POST /api/alignment/clarity/suggest
 *
 * Provides AI-powered suggestions for clarity form sections:
 * - Topic suggestions
 * - Partner relationship type suggestions
 * - Desired outcome suggestions
 *
 * Uses Claude Haiku 4.5 for fast, cost-effective responses.
 */

import { generateText } from 'ai';
import { resolveModel } from '@/app/lib/ai-config';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import { createErrorResponse, ValidationError, AIError, AlignmentError, RateLimitError } from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';

// ============================================================================
// Request/Response Schema
// ============================================================================

const RequestSchema = z.object({
  // Optional: not sent by the current ClarityForm caller. When present, we
  // verify the caller is a participant on that alignment before generating.
  // When absent, requireAuth() + the per-user rate limit below are the only
  // guards (this endpoint accepts arbitrary client-supplied context and
  // doesn't read any specific alignment's data server-side).
  alignmentId: z.string().uuid('Invalid alignment ID format').optional(),
  section: z.enum(['topic', 'partner', 'outcome']),
  currentValue: z.string().optional(),
  prompt: z.string(),
  alignmentContext: z.object({
    topic: z.string(),
    participants: z.array(z.string()),
    desiredOutcome: z.string(),
  }),
});

interface SuggestionResponse {
  suggestions: Array<{
    text: string;
    confidence: number;
  }>;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  let modelName = 'db-config';

  let userId: string | undefined;

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);
    userId = user.id;

    // 1b. Rate limit (light AI operation): ~30/min/user
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.clarity-suggest'),
      { limit: 30, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many suggestion requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validationResult.error.format() }
      );
    }

    const { alignmentId, section, currentValue, prompt, alignmentContext } = validationResult.data;

    // 2b. If the caller references a specific alignment, verify participation
    if (alignmentId) {
      const { data: participant, error: participantError } = await supabase
        .from('alignment_participants')
        .select('id')
        .eq('alignment_id', alignmentId)
        .eq('user_id', userId)
        .single();

      if (participantError || !participant) {
        throw AlignmentError.unauthorized(alignmentId, userId);
      }
    }

    // 3. Log telemetry start
    telemetry.logAIOperation({
      event: 'ai.suggestion.start',
      alignmentId: 'clarity-form',
      latencyMs: 0,
      model: modelName,
      success: true,
      userId,
    });

    // 4. Load prompt config and render the DB-managed template
    const promptConfig = await getPrompt(`clarity-suggest-${section}`);
    modelName = promptConfig.model;
    const aiPrompt = renderPrompt(promptConfig.userPromptTemplate, {
      currentValue: currentValue || 'none yet',
      topic: alignmentContext.topic || '',
      participants: alignmentContext.participants.join(' and '),
    });

    // 5. Generate AI response (prompt text, model, and params all from the DB)
    const { text, usage } = await generateText({
      model: resolveModel(promptConfig.model) as any,
      system: promptConfig.systemPrompt,
      prompt: aiPrompt,
      temperature: promptConfig.temperature,
      maxOutputTokens: promptConfig.maxTokens,
    });

    if (!text || text.trim().length === 0) {
      throw AIError.generationFailed('clarity suggestion', 'Empty response from AI model');
    }

    // 6. Parse suggestions (one per line)
    const suggestionTexts = text
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')) // Remove bullets/numbering
      .slice(0, 3); // Max 3 suggestions

    const suggestions = suggestionTexts.map((suggestionText) => ({
      text: suggestionText,
      confidence: 0.8, // Static confidence for clarity suggestions
    }));

    // 7. Log successful completion
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.suggestion.complete',
      alignmentId: 'clarity-form',
      latencyMs,
      model: modelName,
      success: true,
      userId,
      tokenUsage: usage ? {
        prompt: usage.inputTokens ?? 0,
        completion: usage.outputTokens ?? 0,
        total: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      } : undefined,
    });

    // 8. Return response
    const response: SuggestionResponse = {
      suggestions,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Latency-Ms': latencyMs.toString(),
      },
    });

  } catch (error) {
    // Log error telemetry
    const latencyMs = timer.stop();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any).code || 'UNKNOWN';

    telemetry.logAIOperation({
      event: 'ai.suggestion.error',
      alignmentId: 'clarity-form',
      latencyMs,
      model: modelName,
      success: false,
      userId,
      errorCode,
      errorMessage,
    });

    // Return error response
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
