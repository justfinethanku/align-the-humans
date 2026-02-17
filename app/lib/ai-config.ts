/**
 * Centralized AI model configuration
 *
 * All AI model references and default parameters should use these constants.
 * This will be replaced by database-backed prompt management in Phase 3.
 */

import { anthropic } from '@ai-sdk/anthropic';

// Model IDs - official Anthropic identifiers
export const AI_MODELS = {
  /** Primary model for analysis, document generation, and complex reasoning */
  SONNET: 'claude-sonnet-4-6',
  /** Fast model for inline suggestions, clarity assistance, and lightweight tasks */
  HAIKU: 'claude-haiku-4-5-20251001',
} as const;

// Pre-configured model instances
export const models = {
  sonnet: anthropic(AI_MODELS.SONNET),
  haiku: anthropic(AI_MODELS.HAIKU),
} as const;

// Default parameters by use case
export const AI_DEFAULTS = {
  analysis: { temperature: 0.3, maxTokens: 4096 },
  generation: { temperature: 0.5, maxTokens: 4096 },
  suggestion: { temperature: 0.7, maxTokens: 1024 },
  clarify: { temperature: 0.7, maxTokens: 1024 },
} as const;

/**
 * Resolves a model ID string to an Anthropic provider instance.
 * Used by the prompt management system to dynamically select models.
 */
export function resolveModel(modelId: string) {
  return anthropic(modelId);
}
