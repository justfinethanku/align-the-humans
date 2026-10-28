/**
 * Question generation accepts a model payload, then keeps every question
 * that satisfies AlignmentQuestionSchema.
 *
 * The object schema sent to the model leaves `options` optional. Providers
 * still return that object when a choice question has no options. Rejecting
 * the whole array at that point throws away the valid questions and the
 * route serves the curated template. Choice questions without options are
 * dropped here. The curated template is only for an empty result.
 */

import { z } from 'zod';
import { AlignmentQuestionSchema } from './schemas';
import type { AlignmentQuestion } from './types';

const QUESTION_TYPES = new Set([
  'short_text',
  'long_text',
  'multiple_choice',
  'checkbox',
  'number',
  'scale',
]);

const CHOICE_TYPES = new Set(['multiple_choice', 'checkbox', 'scale']);

/** Top-level cap in AlignmentQuestionsArraySchema. */
const MAX_QUESTIONS = 20;

/**
 * Appended to the generate-questions prompt in code so a stored prompt that
 * predates this rule still tells the model that choice questions need options.
 */
export const CHOICE_QUESTION_OPTIONS_RULE =
  'Hard rule: multiple_choice, checkbox, and scale questions must include an options array of 3 to 5 items. Each option has an id and a label. Do not emit those types without options. Use long_text when you do not have concrete options.';

/**
 * Schema passed to generateObject. Options stay optional so one choice
 * question without options does not fail the provider parse for the batch.
 */
export const generatedQuestionsSchema = z.object({
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
      ).describe(
        'Required for multiple_choice, checkbox, and scale: 3 to 5 options, each with an id and a label. Omit for short_text, long_text, and number.'
      ).optional(),
      followUps: z.array(z.any()).optional(),
      aiHints: z.object({
        explainPrompt: z.string().optional(),
        examplePrompt: z.string().optional(),
        suggestionPrompt: z.string().optional(),
      }).optional(),
      // Explicit keys: the AI SDK marks zod 4 records as closed objects,
      // so a record here would tell the model metadata must be empty.
      metadata: z.object({
        category: z.string().optional(),
        placeholder: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
    })
  ),
});

export interface UsableGeneratedQuestions {
  questions: AlignmentQuestion[];
  dropped: number;
}

/**
 * Keeps questions that pass AlignmentQuestionSchema, in model order, up to 20.
 * `input` is the `questions` array from the model object.
 */
export function selectUsableGeneratedQuestions(input: unknown): AlignmentQuestion[] {
  if (!Array.isArray(input)) return [];

  const usedIds = new Set<string>();
  const kept: AlignmentQuestion[] = [];
  for (const raw of input) {
    const question = coerceQuestion(raw, usedIds);
    if (!question) continue;
    kept.push(question);
    if (kept.length >= MAX_QUESTIONS) break;
  }
  return kept;
}

export function takeUsableGeneratedQuestions(questions: unknown): UsableGeneratedQuestions {
  const received = Array.isArray(questions) ? questions.length : 0;
  const usable = selectUsableGeneratedQuestions(questions);
  return {
    questions: usable,
    dropped: Math.max(0, received - usable.length),
  };
}

function coerceQuestion(raw: unknown, usedIds: Set<string>): AlignmentQuestion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.type !== 'string' || !QUESTION_TYPES.has(source.type)) return null;

  const prompt = typeof source.prompt === 'string' ? source.prompt.trim().slice(0, 500) : '';
  if (prompt.length < 10) return null;

  const idBase = normalizeQuestionId(source.id)
    ?? normalizeQuestionId(prompt.split(/\s+/).slice(0, 8).join(' '));
  if (!idBase) return null;
  const id = claimId(idBase, usedIds);

  const options = cleanOptions(source.options);
  if (CHOICE_TYPES.has(source.type) && (!options || options.length === 0)) {
    return null;
  }

  const followUps = Array.isArray(source.followUps)
    ? source.followUps
      .map((item) => coerceQuestion(item, usedIds))
      .filter((item): item is AlignmentQuestion => item !== null)
    : [];

  const candidate: Record<string, unknown> = {
    id,
    prompt,
    type: source.type,
    required: typeof source.required === 'boolean' ? source.required : true,
  };
  if (options && options.length > 0) candidate.options = options;

  const description = typeof source.description === 'string'
    ? source.description.trim().slice(0, 1000)
    : '';
  if (description) candidate.description = description;

  const aiHints = cleanHints(source.aiHints);
  if (aiHints) candidate.aiHints = aiHints;

  const metadata = cleanMetadata(source.metadata);
  if (metadata) candidate.metadata = metadata;
  if (followUps.length > 0) candidate.followUps = followUps;

  const parsed = AlignmentQuestionSchema.safeParse(candidate);
  if (parsed.success) return parsed.data as AlignmentQuestion;

  if (candidate.followUps) {
    delete candidate.followUps;
    const retry = AlignmentQuestionSchema.safeParse(candidate);
    if (retry.success) return retry.data as AlignmentQuestion;
  }
  return null;
}

function normalizeQuestionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
    .replace(/_+$/g, '');
  if (!/^[a-z0-9_]+$/.test(normalized)) return null;
  return normalized;
}

function claimId(base: string, used: Set<string>): string {
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

function cleanOptions(options: unknown): Array<{ id: string; label: string }> | undefined {
  if (!Array.isArray(options)) return undefined;
  const used = new Set<string>();
  const cleaned: Array<{ id: string; label: string }> = [];
  for (const option of options) {
    const fields = optionFields(option);
    if (!fields) continue;
    const id = claimId(fields.id, used);
    cleaned.push({ id, label: fields.label });
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

function optionFields(option: unknown): { id: string; label: string } | null {
  if (typeof option === 'string') {
    const label = option.trim();
    if (!label) return null;
    return { id: normalizeQuestionId(label) ?? 'option', label };
  }
  if (!option || typeof option !== 'object') return null;
  const record = option as Record<string, unknown>;
  const label = typeof record.label === 'string' ? record.label.trim() : '';
  if (!label) return null;
  const rawId = typeof record.id === 'string' ? record.id.trim() : '';
  return { id: rawId || normalizeQuestionId(label) || 'option', label };
}

function cleanHints(value: unknown): AlignmentQuestion['aiHints'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const hints: NonNullable<AlignmentQuestion['aiHints']> = {};
  for (const key of ['explainPrompt', 'examplePrompt', 'suggestionPrompt'] as const) {
    if (typeof record[key] === 'string' && record[key].trim()) {
      hints[key] = record[key].trim();
    }
  }
  return Object.keys(hints).length > 0 ? hints : undefined;
}

function cleanMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
