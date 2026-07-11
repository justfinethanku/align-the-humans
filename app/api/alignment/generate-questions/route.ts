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
import { resolveModel } from '@/app/lib/ai-config';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
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
  RateLimitError,
  createErrorResponse,
  logError,
} from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
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

    // 1b. Rate limit (heavy AI operation): ~10/min/user
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.generate-questions'),
      { limit: 10, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many question generation requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

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

    // A draft is activated by its creator. Claim access before any AI work so
    // concurrent requests cannot spend the same free run or paid credit twice.
    if (alignment.status === 'draft') {
      if (alignment.created_by !== userId) {
        throw AlignmentError.unauthorized(validatedRequest.alignmentId, userId);
      }

      const { data: activationClaim, error: activationClaimError } = await supabase
        .rpc('claim_alignment_activation', {
          p_alignment_id: validatedRequest.alignmentId,
        })
        .single();

      if (activationClaimError || !activationClaim) {
        throw new AlignmentError(
          'We could not verify alignment access. Please try again.',
          'ALIGNMENT_ACTIVATION_CLAIM_ERROR',
          500,
          {
            alignmentId: validatedRequest.alignmentId,
            databaseMessage: activationClaimError?.message,
          }
        );
      }

      if (!activationClaim.allowed) {
        throw new AlignmentError(
          'You have used your free creator alignment.',
          'FREE_LIMIT_REACHED',
          402,
          {
            alignmentId: validatedRequest.alignmentId,
            reason: activationClaim.reason,
          }
        );
      }
    }

    // 4. Generate questions using AI
    const promptConfig = await getPrompt('generate-questions');
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
        model: promptConfig.model,
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
        model: promptConfig.model,
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
      throw new AlignmentError(
        'Failed to save generated questions. Please try again.',
        'QUESTION_TEMPLATE_SAVE_ERROR',
        500,
        { alignmentId: validatedRequest.alignmentId }
      );
    }

    // 6b. Attach template to alignment and advance status if needed
    if (!template?.id) {
      throw new AlignmentError(
        'Generated questions were not saved. Please try again.',
        'QUESTION_TEMPLATE_MISSING',
        500,
        { alignmentId: validatedRequest.alignmentId }
      );
    }

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
      throw new AlignmentError(
        'Failed to attach generated questions to this alignment. Please try again.',
        'QUESTION_TEMPLATE_ATTACH_ERROR',
        500,
        { alignmentId: validatedRequest.alignmentId, templateId: template.id }
      );
    }

    // 7. Log success
    if (source.type === 'ai') {
      telemetry.logAIOperation({
        event: 'ai.generation.complete',
        alignmentId: validatedRequest.alignmentId,
        latencyMs: timer.stop(),
        model: promptConfig.model,
        success: true,
        userId,
      });
    }

    // 8. Return response
    const response: GenerateQuestionsResponse = {
      data: {
        templateId: template.id,
        version: template.version,
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
        model: 'db-config',
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

  const promptConfig = await getPrompt('generate-questions');

  telemetry.logAIOperation({
    event: 'ai.generation.start',
    alignmentId: request.alignmentId,
    latencyMs: 0,
    model: promptConfig.model,
    success: true,
    userId,
  });

  try {
    const { object } = await generateObject({
      model: resolveModel(promptConfig.model) as any,
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
      system: promptConfig.systemPrompt,
      prompt: renderPrompt(promptConfig.userPromptTemplate, {
        topic: request.clarity.topic,
        participants: request.clarity.participants.join(' and '),
        desiredOutcome: request.clarity.desiredOutcome,
        templateSeed: request.templateSeed,
        focusAreas: buildFocusAreas(request.templateSeed),
      }),
      temperature: promptConfig.temperature,
      maxOutputTokens: promptConfig.maxTokens,
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
/**
 * Template-specific focus areas injected into the DB-managed question
 * generation template via the {{focusAreas}} placeholder.
 */
function buildFocusAreas(templateSeed: string): string {
  if (templateSeed === 'operating_agreement') {
    return `Focus Areas Based on Template:
- Equity and ownership structure
- Roles and responsibilities
- Decision-making processes
- Time commitment and compensation
- Intellectual property
- Disagreement resolution frameworks
- Exit scenarios
- Vesting schedules`;
  }

  return `Focus Areas:
- Core goals and objectives
- Expectations from each party
- Key concerns and priorities
- Success metrics
- Boundaries and deal-breakers
- Implementation details`;
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
