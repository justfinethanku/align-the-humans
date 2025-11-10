/**
 * Zod Validation Schemas
 *
 * Type-safe validation for API requests, responses, and AI-generated content.
 */

import { z } from 'zod';

// ============================================================================
// AlignmentQuestion Schemas
// ============================================================================

/**
 * Question option schema (for multiple_choice, checkbox, scale)
 */
export const QuestionOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  label: z.string().min(1, 'Option label is required'),
});

/**
 * AI hints schema for question assistance
 */
export const AIHintsSchema = z.object({
  explainPrompt: z.string().optional(),
  examplePrompt: z.string().optional(),
  suggestionPrompt: z.string().optional(),
});

/**
 * Alignment question schema (recursive for followUps)
 */
export const AlignmentQuestionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1, 'Question ID is required').regex(/^[a-z0-9_]+$/, 'Question ID must be lowercase alphanumeric with underscores'),
    prompt: z.string().min(10, 'Question prompt must be at least 10 characters').max(500, 'Question prompt too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    type: z.enum(['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale']),
    required: z.boolean(),
    options: z.array(QuestionOptionSchema).optional(),
    followUps: z.array(AlignmentQuestionSchema).optional(),
    aiHints: AIHintsSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // If type is multiple_choice or checkbox, options are required
      if (['multiple_choice', 'checkbox', 'scale'].includes(data.type)) {
        return data.options && data.options.length > 0;
      }
      return true;
    },
    {
      message: 'Options are required for multiple_choice, checkbox, and scale question types',
      path: ['options'],
    }
  )
);

/**
 * Array of alignment questions
 */
export const AlignmentQuestionsArraySchema = z.array(AlignmentQuestionSchema).min(1, 'At least one question is required').max(20, 'Too many questions (max 20)');

// ============================================================================
// API Request/Response Schemas
// ============================================================================

/**
 * Clarity context schema
 */
export const ClarityContextSchema = z.object({
  topic: z.string().min(5, 'Topic must be at least 5 characters').max(200, 'Topic too long'),
  participants: z.array(z.string().min(1, 'Participant name required')).min(2, 'At least 2 participants required').max(10, 'Too many participants (max 10)'),
  desiredOutcome: z.string().min(10, 'Desired outcome must be at least 10 characters').max(500, 'Desired outcome too long'),
});

/**
 * Generate questions request schema
 */
export const GenerateQuestionsRequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID'),
  templateSeed: z.enum(['operating_agreement', 'custom']),
  clarity: ClarityContextSchema,
  seedTemplateId: z.string().uuid().optional(),
});

/**
 * Generate questions response schema
 */
export const GenerateQuestionsResponseSchema = z.object({
  data: z.object({
    templateId: z.string().uuid(),
    version: z.number().int().positive(),
    source: z.object({
      type: z.enum(['ai', 'curated']),
      model: z.string().optional(),
    }),
    questions: AlignmentQuestionsArraySchema,
  }),
});

// ============================================================================
// AI Generation Schemas
// ============================================================================

/**
 * Schema for AI-generated question output validation
 * Ensures AI produces valid question structures
 */
export const AIGeneratedQuestionsSchema = z.object({
  questions: AlignmentQuestionsArraySchema,
  metadata: z.object({
    model: z.string(),
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    generation_time_ms: z.number().optional(),
  }).optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type QuestionOptionInput = z.infer<typeof QuestionOptionSchema>;
export type AIHintsInput = z.infer<typeof AIHintsSchema>;
export type AlignmentQuestionInput = z.infer<typeof AlignmentQuestionSchema>;
export type ClarityContextInput = z.infer<typeof ClarityContextSchema>;
export type GenerateQuestionsRequestInput = z.infer<typeof GenerateQuestionsRequestSchema>;
export type GenerateQuestionsResponseInput = z.infer<typeof GenerateQuestionsResponseSchema>;
export type AIGeneratedQuestionsInput = z.infer<typeof AIGeneratedQuestionsSchema>;
