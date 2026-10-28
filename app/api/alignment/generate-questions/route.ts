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
import { generateObjectRecovered } from '@/app/lib/ai-generate';
import { asAIGenerationError, InvalidModelOutputError } from '@/app/lib/ai-recovery';
import {
  CHOICE_QUESTION_OPTIONS_RULE,
  generatedQuestionsSchema,
  takeUsableGeneratedQuestions,
} from '@/app/lib/generated-questions';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';

import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { GenerateQuestionsRequestSchema } from '@/app/lib/schemas';
import {
  getFallbackTemplate,
  sanitizeQuestions,
} from '@/app/lib/templates';
import {
  ValidationError,
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
  const supabase = await createServerClient();

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
    let droppedQuestionCount = 0;

    try {
      const generatedQuestions = await generateQuestionsWithAI(
        validatedRequest,
        userId
      );
      questions = generatedQuestions.questions;
      droppedQuestionCount = generatedQuestions.dropped;
      source = {
        type: 'ai',
        model: generatedQuestions.modelId,
      };
      if (generatedQuestions.dropped > 0) {
        console.warn('Kept generated questions that passed validation and dropped the rest', {
          alignmentId: validatedRequest.alignmentId,
          kept: questions.length,
          dropped: generatedQuestions.dropped,
        });
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
            ...(source.type === 'ai' ? { droppedQuestionCount } : {}),
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
    if (source.type === 'ai' && source.model) {
      telemetry.logAIOperation({
        event: 'ai.generation.complete',
        alignmentId: validatedRequest.alignmentId,
        latencyMs: timer.stop(),
        model: source.model,
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
): Promise<{ questions: AlignmentQuestion[]; dropped: number; modelId: string }> {
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
    const recovered = await generateObjectRecovered({
      modelId: promptConfig.model,
      task: 'structured',
      schema: generatedQuestionsSchema,
      system: promptConfig.systemPrompt,
      prompt: `${renderPrompt(promptConfig.userPromptTemplate, {
        topic: request.clarity.topic,
        participants: request.clarity.participants.join(' and '),
        desiredOutcome: request.clarity.desiredOutcome,
        templateSeed: request.templateSeed,
        focusAreas: buildFocusAreas(request.templateSeed),
      })}\n\n${CHOICE_QUESTION_OPTIONS_RULE}`,
      temperature: promptConfig.temperature,
      maxOutputTokens: promptConfig.maxTokens,
      // A mixed batch is usable. Retry only when every question is unusable,
      // so one option-less choice question does not discard the rest.
      validate: (object) => {
        if (takeUsableGeneratedQuestions(object.questions).questions.length === 0) {
          throw new InvalidModelOutputError('No usable questions produced');
        }
      },
    });

    const selected = takeUsableGeneratedQuestions(recovered.object.questions);
    return {
      questions: selected.questions,
      dropped: selected.dropped,
      modelId: recovered.modelId,
    };
  } catch (error) {
    logError(error, {
      alignmentId: request.alignmentId,
      operation: 'generateQuestionsWithAI',
    });
    throw asAIGenerationError('question generation', error);
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

  if (templateSeed === 'new_partner') {
    return `Focus Areas Based on Template:
- The incoming partner's role and decision-making authority
- Ownership or equity offered, and how it is earned
- First-year compensation and how it changes
- Existing clients, work in progress, and what the new partner brings
- Time commitment and first-year expectations
- What happens if the arrangement is not working`;
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
