/**
 * AI-Powered Inline Suggestion API
 *
 * Provides intelligent assistance for alignment questions:
 * - Explain: Clarifies what the question is asking
 * - Examples: Provides relevant real-world examples
 * - Suggest: Proposes thoughtful answers based on context
 *
 * Uses Claude Haiku 4.5 for fast, cost-effective responses.
 *
 * Reference: plan_a.md lines 770-775, 1173-1193
 */

import { generateText } from 'ai';
import { models, AI_MODELS, resolveModel } from '@/app/lib/ai-config';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { TemplateQuestion } from '@/app/lib/types';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import { createErrorResponse, ValidationError, AIError, AlignmentError, RateLimitError } from '@/app/lib/errors';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { isParticipant } from '@/app/lib/db-helpers';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';

// ============================================================================
// Request/Response Schema
// ============================================================================

/**
 * Suggestion mode types
 */
const SuggestionMode = z.enum(['explain', 'examples', 'suggest']);
type SuggestionMode = z.infer<typeof SuggestionMode>;

/**
 * Request body schema
 */
const RequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID'),
  question: z.object({
    id: z.string(),
    type: z.enum(['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale']),
    text: z.string(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    placeholder: z.string().optional(),
    help_text: z.string().optional(),
    ai_prompt: z.string().optional(),
  }),
  currentAnswer: z.string().optional().nullable(),
  mode: SuggestionMode,
  alignmentContext: z.object({
    topic: z.string(),
    round: z.number().int().positive(),
  }),
});

type RequestBody = z.infer<typeof RequestSchema>;

/**
 * Response body structure
 */
interface ResponseBody {
  data: {
    text: string;
    confidence: number;
  };
}

// ============================================================================
// AI Prompt Construction
// ============================================================================

/**
 * Calculates confidence score based on question type and response quality
 */
function calculateConfidence(
  mode: SuggestionMode,
  question: TemplateQuestion,
  responseLength: number
): number {
  // Base confidence by mode
  let confidence = 0.8;

  if (mode === 'explain') {
    confidence = 0.9; // Explanations are straightforward
  } else if (mode === 'examples') {
    confidence = 0.85; // Examples are generally reliable
  } else if (mode === 'suggest') {
    confidence = 0.75; // Suggestions are more subjective
  }

  // Adjust based on question complexity
  if (question.type === 'multiple_choice' || question.type === 'checkbox') {
    confidence += 0.05; // Structured questions easier to help with
  } else if (question.type === 'long_text') {
    confidence -= 0.1; // Open-ended questions more subjective
  }

  // Adjust based on response quality (length as proxy)
  if (responseLength < 50) {
    confidence -= 0.15; // Short responses may lack detail
  } else if (responseLength > 300) {
    confidence += 0.05; // Comprehensive responses
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, confidence));
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * POST /api/alignment/get-suggestion
 *
 * Generates AI-powered suggestions for alignment questions
 */
export async function POST(request: NextRequest): Promise<Response> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  const modelName = AI_MODELS.HAIKU;
  const model = models.haiku;
  let telemetryAlignmentId = 'suggestion-request';
  let telemetryUserId: string | undefined;

  try {
    // Authenticate user
    const user = await requireAuth(supabase);
    telemetryUserId = user.id;

    // Rate limit (light AI operation): ~30/min/user
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.get-suggestion'),
      { limit: 30, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many suggestion requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validationResult.error.format() }
      );
    }

    const { alignmentId, question, currentAnswer, mode, alignmentContext } = validationResult.data;
    telemetryAlignmentId = alignmentId;

    // Ensure user is a participant in the alignment
    const isUserParticipant = await isParticipant(supabase, alignmentId, user.id);
    if (!isUserParticipant) {
      throw AlignmentError.unauthorized(alignmentId, user.id);
    }

    // Log telemetry start
    telemetry.logAIOperation({
      event: 'ai.suggestion.start',
      alignmentId: telemetryAlignmentId,
      latencyMs: 0,
      model: modelName,
      success: true,
      userId: telemetryUserId,
    });

    // Load prompt config based on mode and render the DB-managed template
    const promptSlug = `suggestion-${mode}`;
    const promptConfig = await getPrompt(promptSlug);

    const suggestionInstruction =
      mode === 'suggest'
        ? currentAnswer
          ? 'Provide a suggestion to improve or expand their current answer. Be constructive and specific.'
          : 'Suggest a thoughtful starting point for answering this question. Encourage them to personalize it.'
        : '';

    const prompt = renderPrompt(promptConfig.userPromptTemplate, {
      topic: alignmentContext.topic,
      questionText: question.text,
      helpText: question.help_text ? `Context: ${question.help_text}` : '',
      currentAnswer:
        mode === 'suggest' && currentAnswer
          ? `Their current draft answer: "${currentAnswer}"`
          : '',
      suggestionInstruction,
    });

    // Generate AI response using Vercel AI SDK
    const { text, usage } = await generateText({
      model: resolveModel(promptConfig.model) as any,
      system: promptConfig.systemPrompt,
      prompt,
      maxOutputTokens: promptConfig.maxTokens,
      temperature: promptConfig.temperature,
    });

    if (!text || text.trim().length === 0) {
      throw AIError.generationFailed('suggestion', 'Empty response from AI model');
    }

    // Calculate confidence score
    const confidence = calculateConfidence(mode, question, text.length);

    // Log successful completion
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.suggestion.complete',
      alignmentId: telemetryAlignmentId,
      latencyMs,
      model: modelName,
      success: true,
      userId: telemetryUserId,
      tokenUsage: usage ? {
        prompt: usage.inputTokens ?? 0,
        completion: usage.outputTokens ?? 0,
        total: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      } : undefined,
    });

    // Return response
    const responseBody: ResponseBody = {
      data: {
        text: text.trim(),
        confidence,
      },
    };

    return Response.json(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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
      alignmentId: telemetryAlignmentId,
      latencyMs,
      model: modelName,
      success: false,
      errorCode,
      errorMessage,
      userId: telemetryUserId,
    });

    // Return error response
    return createErrorResponse(error);
  }
}

/**
 * GET handler - return method not allowed
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST method' } },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
