/**
 * AI Question Generation API Route
 *
 * POST /api/alignment/generate-questions
 *
 * Generates alignment questions using Claude AI based on clarity context.
 * Falls back to curated templates if AI generation fails.
 *
 * Based on plan_a.md lines 1054-1080, 1196-1244
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { models, AI_MODELS } from '@/app/lib/ai-config';
import { z } from 'zod';

import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import {
  GenerateQuestionsRequestSchema,
  AlignmentQuestionsArraySchema,
  AlignmentQuestionSchema,
} from '@/app/lib/schemas';
import {
  getFallbackTemplate,
  sanitizeQuestions,
  isValidQuestion,
} from '@/app/lib/templates';
import {
  ValidationError,
  AIError,
  AlignmentError,
  createErrorResponse,
  logError,
} from '@/app/lib/errors';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import type {
  AlignmentQuestion,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from '@/app/lib/types';

/**
 * POST handler for question generation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();

  let userId: string | undefined;
  let alignmentId: string | undefined;

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);
    userId = user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedRequest = GenerateQuestionsRequestSchema.parse(body);
    alignmentId = validatedRequest.alignmentId;

    // 3. Verify user has access to alignment
    const { data: alignment, error: alignmentError } = await supabase
      .from('alignments')
      .select('id, created_by, partner_id, status')
      .eq('id', validatedRequest.alignmentId)
      .single();

    if (alignmentError || !alignment) {
      throw AlignmentError.notFound(validatedRequest.alignmentId);
    }

    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('alignment_participants')
      .select('id')
      .eq('alignment_id', validatedRequest.alignmentId)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      throw AlignmentError.unauthorized(validatedRequest.alignmentId, userId);
    }

    // 4. Generate questions using AI
    let questions: AlignmentQuestion[];
    let source: GenerateQuestionsResponse['data']['source'];

    try {
      const generatedQuestions = await generateQuestionsWithAI(
        validatedRequest,
        userId
      );
      questions = generatedQuestions.questions;
      source = {
        type: 'ai',
        model: AI_MODELS.SONNET,
      };

      // Validate generated questions
      const validationResult = AlignmentQuestionsArraySchema.safeParse(questions);
      if (!validationResult.success) {
        console.warn('AI-generated questions failed validation, using fallback', validationResult.error);
        throw new Error('Generated questions failed validation');
      }
    } catch (aiError) {
      // Fall back to curated template
      console.warn('AI generation failed, using fallback template', aiError);
      logError(aiError, {
        alignmentId: validatedRequest.alignmentId,
        templateSeed: validatedRequest.templateSeed,
      });

      questions = getFallbackTemplate(validatedRequest.templateSeed);
      source = {
        type: 'curated',
      };

      // Log fallback usage
      telemetry.logAIOperation({
        event: 'ai.generation.error',
        alignmentId: validatedRequest.alignmentId,
        latencyMs: timer.getLatency(),
        model: AI_MODELS.SONNET,
        success: false,
        userId,
        errorCode: 'AI_GENERATION_FALLBACK',
        errorMessage: 'Using curated fallback template',
      });
    }

    // 5. Sanitize questions (remove PII)
    const sanitizedQuestions = sanitizeQuestions(questions);

    // 6. Store template in database
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: `${validatedRequest.clarity.topic} - Generated Template`,
        version: 1,
        content: {
          questions: sanitizedQuestions,
          ai_context: validatedRequest.clarity.desiredOutcome,
          metadata: {
            templateSeed: validatedRequest.templateSeed,
            generatedAt: new Date().toISOString(),
            source: source.type,
            model: source.model,
            alignmentId: validatedRequest.alignmentId,
          },
        } as any, // Type assertion needed for JSONB field
        created_by: userId,
      })
      .select('id, version')
      .single();

    if (templateError) {
      console.error('Failed to store template', templateError);
      // Non-fatal error - continue with response
    }

    // 6b. Attach template to alignment and advance status if needed
    if (template?.id) {
      const alignmentUpdates: Record<string, any> = {
        template_id: template.id,
      };

      if (alignment.status === 'draft') {
        alignmentUpdates.status = 'active';
      }

      const { error: alignmentUpdateError } = await supabase
        .from('alignments')
        .update(alignmentUpdates)
        .eq('id', validatedRequest.alignmentId);

      if (alignmentUpdateError) {
        console.error('Failed to update alignment with template_id', alignmentUpdateError);
      }
    }

    // 7. Log success
    if (source.type === 'ai') {
      telemetry.logAIOperation({
        event: 'ai.generation.complete',
        alignmentId: validatedRequest.alignmentId,
        latencyMs: timer.stop(),
        model: AI_MODELS.SONNET,
        success: true,
        userId,
      });
    }

    // 8. Return response
    const response: GenerateQuestionsResponse = {
      data: {
        templateId: template?.id || 'fallback',
        version: template?.version || 1,
        source,
        questions: sanitizedQuestions,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    // Log error with telemetry
    if (alignmentId && userId) {
      telemetry.logAIOperation({
        event: 'ai.generation.error',
        alignmentId,
        latencyMs: timer.stop(),
        model: AI_MODELS.SONNET,
        success: false,
        userId,
        errorCode: (error as any).code || 'UNKNOWN',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    logError(error, { alignmentId, userId });
    return createErrorResponse(error) as any; // NextResponse type compatibility
  }
}

/**
 * Generates questions using Claude AI
 */
async function generateQuestionsWithAI(
  request: GenerateQuestionsRequest,
  userId: string
): Promise<{ questions: AlignmentQuestion[] }> {
  const timer = new PerformanceTimer();

  telemetry.logAIOperation({
    event: 'ai.generation.start',
    alignmentId: request.alignmentId,
    latencyMs: 0,
    model: AI_MODELS.SONNET,
    success: true,
    userId,
  });

  try {
    const { object } = await generateObject({
      model: models.sonnet as any,
      schema: z.object({
        questions: z.array(
          z.object({
            id: z.string(),
            prompt: z.string(),
            description: z.string().optional(),
            type: z.enum(['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale']),
            required: z.boolean(),
            options: z.array(
              z.object({
                id: z.string(),
                label: z.string(),
              })
            ).optional(),
            followUps: z.array(z.any()).optional(),
            aiHints: z.object({
              explainPrompt: z.string().optional(),
              examplePrompt: z.string().optional(),
              suggestionPrompt: z.string().optional(),
            }).optional(),
            metadata: z.record(z.any()).optional(),
          })
        ),
      }),
      prompt: buildGenerationPrompt(request),
      temperature: 0.7, // Higher temperature for creative question generation
    });

    // Validate that all questions are valid
    const validQuestions = object.questions.filter(isValidQuestion);
    if (validQuestions.length === 0) {
      throw AIError.generationFailed('question generation', 'No valid questions produced');
    }

    return { questions: validQuestions as AlignmentQuestion[] };
  } catch (error) {
    logError(error, {
      alignmentId: request.alignmentId,
      operation: 'generateQuestionsWithAI',
    });
    throw AIError.generationFailed(
      'question generation',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Builds the AI prompt for question generation
 */
function buildGenerationPrompt(request: GenerateQuestionsRequest): string {
  const { clarity, templateSeed } = request;

  const baseContext = `You are an expert facilitator helping two people think through a decision together. Generate a thoughtful set of 5-10 questions that will help each person articulate what matters to them before collaborative synthesis begins.

Context:
- Topic: ${clarity.topic}
- Participants: ${clarity.participants.join(' and ')}
- Desired Outcome: ${clarity.desiredOutcome}
- Template Type: ${templateSeed}

Guidelines:
1. Generate 5-10 questions (no more, no less)
2. Mix question types: use long_text for open-ended questions, multiple_choice for discrete options, scale for preferences
3. Make questions specific to the topic and desired outcome
4. Each question should have a clear, actionable prompt
5. Include helpful descriptions that guide users on what to consider
6. For multiple_choice and scale questions, provide 3-5 relevant options
7. Add AI hints to help users if they get stuck (explainPrompt, examplePrompt, suggestionPrompt)
8. Use snake_case for question IDs (e.g., "equity_split_ratio", "decision_authority")
9. Mark critical questions as required: true
10. Consider adding follow-up questions for complex topics

Question Types:
- short_text: Brief text input (names, titles, single-line answers)
- long_text: Extended text input (explanations, descriptions, detailed answers)
- multiple_choice: Select one option from a list
- checkbox: Select multiple options from a list
- number: Numeric input
- scale: Rating or scale selection (e.g., 1-5, low-high)

Focus Areas Based on Template:`;

  if (templateSeed === 'operating_agreement') {
    return baseContext + `
- Equity and ownership structure
- Roles and responsibilities
- Decision-making processes
- Time commitment and compensation
- Intellectual property
- Disagreement resolution frameworks
- Exit scenarios
- Vesting schedules

Generate questions that cover the most critical aspects of a business operating agreement while staying relevant to: "${clarity.topic}".`;
  }

  return baseContext + `
- Core goals and objectives
- Expectations from each party
- Key concerns and priorities
- Success metrics
- Boundaries and deal-breakers
- Implementation details

Generate questions that explore the fundamentals of reaching agreement on: "${clarity.topic}".`;
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
