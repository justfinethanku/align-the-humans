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
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import { createErrorResponse, ValidationError, AIError } from '@/app/lib/errors';

// ============================================================================
// Request/Response Schema
// ============================================================================

const RequestSchema = z.object({
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
// AI Prompt Construction
// ============================================================================

function buildSuggestionPrompt(
  section: string,
  currentValue: string,
  context: { topic: string; participants: string[]; desiredOutcome: string }
): string {
  if (section === 'topic') {
    return `You are helping someone define what they want to align on. Generate 2-3 clear, specific topic suggestions for an alignment conversation.

Current input: "${currentValue || 'none yet'}"
Context: This is for a conversation between ${context.participants.join(' and ')}.

Provide 2-3 diverse, realistic examples of alignment topics. Each should be:
- Clear and specific (not vague)
- Realistic and relatable
- Different from each other
- 8-15 words long

Examples of good topics:
- "Deciding on our vacation destination for this summer"
- "Finalizing the budget for the home renovation project"
- "Choosing which city to relocate to for work"

Return only the topic suggestions, one per line, without numbering or explanations.`;
  }

  if (section === 'partner') {
    return `You are helping someone identify their partner for an alignment conversation. Generate 2-3 common relationship type suggestions.

Current input: "${currentValue || 'none yet'}"
Topic: "${context.topic}"

Provide 2-3 common relationship types that make sense for this topic. Examples:
- "My spouse"
- "My business co-founder"
- "A family member"
- "My roommate"

Return only the relationship descriptions, one per line, without numbering or explanations.`;
  }

  // outcome section
  return `You are helping someone define the desired outcome of an alignment conversation. Generate 2-3 clear outcome suggestions.

Current input: "${currentValue || 'none yet'}"
Topic: "${context.topic}"
Participants: ${context.participants.join(' and ')}

Provide 2-3 realistic desired outcomes. Each should be:
- Clear and achievable
- Specific to reaching agreement
- Different from each other

Examples of good outcomes:
- "A clear, mutual decision we both feel good about"
- "A list of actionable next steps we both commit to"
- "Understanding each other's perspective and finding common ground"

Return only the outcome descriptions, one per line, without numbering or explanations.`;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  const modelName = 'claude-haiku-4.5';
  const model = anthropic(modelName);

  let userId: string | undefined;

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);
    userId = user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validationResult.error.format() }
      );
    }

    const { section, currentValue, prompt, alignmentContext } = validationResult.data;

    // 3. Log telemetry start
    telemetry.logAIOperation({
      event: 'ai.suggestion.start',
      alignmentId: 'clarity-form',
      latencyMs: 0,
      model: modelName,
      success: true,
      userId,
    });

    // 4. Build prompt
    const aiPrompt = buildSuggestionPrompt(
      section,
      currentValue || '',
      alignmentContext
    );

    // 5. Generate AI response
    const { text, usage } = await generateText({
      model: model as any,
      prompt: aiPrompt,
      temperature: 0.7, // Creative but focused
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
