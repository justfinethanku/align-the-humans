/**
 * Retry and fallback for empty or schema-invalid model output.
 *
 * The prompts table stores one model per prompt (`prompts.model`), chosen in
 * admin. An empty reply from that model is often transient: the same request
 * can succeed seconds later. This helper calls that model again, then calls
 * one other model the caller names (see `fallbackModelFor` in ai-config).
 * HTTP 401/400 and other non-output failures are not retried here. The AI SDK
 * still applies its own retries to network and provider HTTP errors.
 */

import { AIError, AppError, isAppError } from './errors';
import { AI_OUTPUT_RETRY_MESSAGE } from './api-error-message';

const RECOVERABLE_ERROR_NAMES = new Set([
  'EmptyModelOutputError',
  'InvalidModelOutputError',
  'AI_NoObjectGeneratedError',
  'AI_NoOutputGeneratedError',
  'AI_NoContentGeneratedError',
  'AI_EmptyResponseBodyError',
  'AI_JSONParseError',
  'AI_TypeValidationError',
  'AI_InvalidResponseDataError',
]);

export class EmptyModelOutputError extends Error {
  constructor(message = 'Empty response from AI model') {
    super(message);
    this.name = 'EmptyModelOutputError';
  }
}

export class InvalidModelOutputError extends Error {
  constructor(message = 'Model output failed schema validation') {
    super(message);
    this.name = 'InvalidModelOutputError';
  }
}

export interface ModelAttempt {
  modelId: string;
  outcome: 'success' | 'retry' | 'fallback' | 'failed';
  errorName?: string;
  errorMessage?: string;
}

export function isRecoverableModelFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = errorName(error);
  if (RECOVERABLE_ERROR_NAMES.has(name)) return true;
  if (name === 'AI_RetryError' && 'lastError' in error) {
    return isRecoverableModelFailure((error as { lastError: unknown }).lastError);
  }
  return false;
}

/**
 * Throws when text is missing, blank, or rejected by `accept`.
 * `accept` covers replies that parse to nothing, such as bullet-only lines.
 */
export function ensureUsableModelText(
  text: string | null | undefined,
  accept?: (text: string) => boolean
): string {
  const value = text ?? '';
  if (value.trim().length === 0 || (accept && !accept(value))) {
    throw new EmptyModelOutputError();
  }
  return value;
}

/**
 * One suggestion per line, with bullets and numbering removed.
 * Lines that are empty after that cleanup are dropped.
 */
const BULLET_PREFIX = /^[-•*]\s*/;
const NUMBER_PREFIX = /^\d+\.\s*/;

export function usableSuggestionLines(text: string, limit = 3): string[] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(BULLET_PREFIX, '').replace(NUMBER_PREFIX, ''))
    .filter((line) => line.length > 0)
    .slice(0, limit);
}

export function hasUsableSuggestionLines(text: string): boolean {
  return usableSuggestionLines(text).length > 0;
}

function errorName(error: object): string {
  return 'name' in error ? String((error as { name: unknown }).name) : '';
}

function statusCodeOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) return undefined;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === 'number' ? status : undefined;
}

function defaultLog(attempt: ModelAttempt): void {
  if (attempt.outcome === 'success') return;
  console.warn(JSON.stringify({
    event: 'ai.model_recovery',
    model: attempt.modelId,
    outcome: attempt.outcome,
    errorName: attempt.errorName,
    errorMessage: attempt.errorMessage,
  }));
}

/**
 * Runs `run` on the primary model, then on the fallback model.
 * Default is two primary attempts and one fallback attempt.
 */
export async function withModelRecovery<T>(options: {
  modelId: string;
  fallbackModelId: string;
  run: (modelId: string) => Promise<T>;
  primaryAttempts?: number;
  fallbackAttempts?: number;
  onModel?: (modelId: string) => void;
  log?: (attempt: ModelAttempt) => void;
}): Promise<{ value: T; modelId: string; attempts: ModelAttempt[] }> {
  const primaryAttempts = options.primaryAttempts ?? 2;
  const fallbackAttempts = options.fallbackAttempts ?? 1;
  const fallback =
    options.fallbackModelId && options.fallbackModelId !== options.modelId
      ? options.fallbackModelId
      : null;
  const plan = [
    ...Array.from({ length: Math.max(1, primaryAttempts) }, () => options.modelId),
    ...(fallback ? Array.from({ length: Math.max(0, fallbackAttempts) }, () => fallback) : []),
  ];
  const log = options.log ?? defaultLog;
  const attempts: ModelAttempt[] = [];
  let lastError: unknown;

  for (let index = 0; index < plan.length; index += 1) {
    const modelId = plan[index];
    options.onModel?.(modelId);
    try {
      const value = await options.run(modelId);
      const attempt: ModelAttempt = { modelId, outcome: 'success' };
      attempts.push(attempt);
      log(attempt);
      return { value, modelId, attempts };
    } catch (error) {
      lastError = error;
      const recoverable = isRecoverableModelFailure(error);
      const hasNext = index < plan.length - 1 && recoverable;
      const nextIsFallback = hasNext && plan[index + 1] !== modelId;
      const attempt: ModelAttempt = {
        modelId,
        outcome: !hasNext ? 'failed' : nextIsFallback ? 'fallback' : 'retry',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      attempts.push(attempt);
      log(attempt);
      if (!hasNext) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new EmptyModelOutputError();
}

/**
 * Turns a model failure into an API error.
 * Empty and invalid output use a message the user can act on.
 * Rate limits and other AppErrors keep their own messages.
 */
export function asAIGenerationError(operation: string, error: unknown): AppError {
  if (isAppError(error)) return error;
  const reason = error instanceof Error ? error.message : 'Unknown error';
  const status = statusCodeOf(error);
  if (status === 429 || /rate[_ ]limit/i.test(reason)) {
    return AIError.rateLimitExceeded();
  }
  return new AIError(AI_OUTPUT_RETRY_MESSAGE, 'AI_GENERATION_FAILED', 502, {
    operation,
    reason,
  });
}

export function errorLogMessage(error: unknown): string {
  if (isAppError(error)) {
    const reason = error.details?.reason;
    if (typeof reason === 'string' && reason.length > 0 && !error.message.includes(reason)) {
      return `${error.message} (${reason})`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Unknown error';
}
