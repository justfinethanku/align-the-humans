/**
 * Centralized AI model configuration
 *
 * All AI model references, default parameters, and model discovery.
 * Prompt management system (app/lib/prompts.ts) uses resolveModel()
 * to dynamically select models from database-stored config.
 */

import { anthropic } from '@ai-sdk/anthropic';

// ============================================================================
// Model Constants
// ============================================================================

/** Model IDs - official Anthropic identifiers */
export const AI_MODELS = {
  /** Primary model for analysis, document generation, and complex reasoning */
  SONNET: 'claude-sonnet-4-6',
  /** Fast model for inline suggestions, clarity assistance, and lightweight tasks */
  HAIKU: 'claude-haiku-4-5-20251001',
} as const;

/** Pre-configured model instances */
export const models = {
  sonnet: anthropic(AI_MODELS.SONNET),
  haiku: anthropic(AI_MODELS.HAIKU),
} as const;

/** Default parameters by use case */
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

// ============================================================================
// Vercel AI Gateway - Dynamic Model Discovery
// ============================================================================

const AI_GATEWAY_BASE_URL = 'https://ai-gateway.vercel.sh/v1';

export interface GatewayModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface GatewayModelsResponse {
  object: string;
  data: GatewayModel[];
}

/** Cache for discovered models (10-minute TTL) */
let modelCache: { models: GatewayModel[]; expiresAt: number } | null = null;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Discovers available models from Vercel AI Gateway.
 * Returns all models accessible with the configured API key.
 * Falls back to hardcoded defaults if the gateway is unavailable.
 */
export async function discoverModels(): Promise<GatewayModel[]> {
  // Check cache
  if (modelCache && Date.now() < modelCache.expiresAt) {
    return modelCache.models;
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return getDefaultModels();
  }

  try {
    const response = await fetch(`${AI_GATEWAY_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`AI Gateway models endpoint returned ${response.status}`);
      return getDefaultModels();
    }

    const data: GatewayModelsResponse = await response.json();
    const allModels = data.data ?? [];

    // Update cache
    modelCache = { models: allModels, expiresAt: Date.now() + MODEL_CACHE_TTL_MS };
    return allModels;
  } catch (error) {
    console.warn('Failed to discover models from AI Gateway:', error);
    return getDefaultModels();
  }
}

/**
 * Discovers available Anthropic models from the AI Gateway.
 * Filters the full model list to only Anthropic provider models.
 */
export async function discoverAnthropicModels(): Promise<GatewayModel[]> {
  const allModels = await discoverModels();
  return allModels.filter(
    (m) => m.id.startsWith('anthropic/') || m.owned_by === 'anthropic'
  );
}

/** Clears the model discovery cache */
export function clearModelCache(): void {
  modelCache = null;
}

/** Fallback models when gateway is unavailable */
function getDefaultModels(): GatewayModel[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    { id: AI_MODELS.SONNET, object: 'model', created: now, owned_by: 'anthropic' },
    { id: AI_MODELS.HAIKU, object: 'model', created: now, owned_by: 'anthropic' },
  ];
}
