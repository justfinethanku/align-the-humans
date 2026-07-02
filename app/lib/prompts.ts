/**
 * Prompt Management System
 *
 * Loads AI prompts from the database with in-memory caching.
 * Falls back to seed data if database is unavailable.
 *
 * Usage:
 * ```ts
 * import { getPrompt, renderPrompt } from '@/app/lib/prompts';
 *
 * const config = await getPrompt('analyze-responses');
 * const prompt = renderPrompt(config.userPromptTemplate, {
 *   responseA: JSON.stringify(answers1),
 *   responseB: JSON.stringify(answers2),
 * });
 * ```
 */

import { PROMPT_SEEDS } from './db/seed-prompts';
import { createAdminClient } from './supabase-server';

// ============================================================================
// Types
// ============================================================================

export interface PromptConfig {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: unknown;
  isActive: boolean;
}

interface CacheEntry {
  config: PromptConfig;
  expiresAt: number;
}

// ============================================================================
// Cache
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const promptCache = new Map<string, CacheEntry>();

function getCached(slug: string): PromptConfig | null {
  const entry = promptCache.get(slug);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(slug);
    return null;
  }
  return entry.config;
}

function setCache(slug: string, config: PromptConfig): void {
  promptCache.set(slug, {
    config,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Clear the prompt cache (useful for admin updates) */
export function clearPromptCache(): void {
  promptCache.clear();
}

// ============================================================================
// Seed Fallback
// ============================================================================

function getSeedPrompt(slug: string): PromptConfig | null {
  const seed = PROMPT_SEEDS.find(s => s.slug === slug);
  if (!seed) return null;

  return {
    slug: seed.slug,
    name: seed.name,
    description: seed.description ?? null,
    category: seed.category ?? 'alignment',
    model: seed.model ?? 'z-ai/glm-5.2',
    temperature: parseFloat(String(seed.temperature ?? '0.3')),
    maxTokens: seed.maxTokens ?? 4096,
    systemPrompt: seed.systemPrompt,
    userPromptTemplate: seed.userPromptTemplate,
    outputSchema: seed.outputSchema ?? null,
    isActive: seed.isActive ?? true,
  };
}

// ============================================================================
// DB Row Mapping
// ============================================================================

/** Snake_case row from public.prompts (not yet in generated Database types). */
interface PromptRow {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  model: string;
  temperature: string | number;
  max_tokens: number;
  system_prompt: string;
  user_prompt_template: string;
  output_schema: unknown;
  is_active: boolean;
}

function mapRowToConfig(row: PromptRow): PromptConfig {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    model: row.model,
    temperature: parseFloat(String(row.temperature)),
    maxTokens: row.max_tokens,
    systemPrompt: row.system_prompt,
    userPromptTemplate: row.user_prompt_template,
    outputSchema: row.output_schema,
    isActive: row.is_active,
  };
}

// The prompts table exists in the DB but is not yet in the generated Database
// types, so we access it through an untyped query-builder boundary (matching
// the codebase's existing `as any` convention for not-yet-typed tables).
// Type safety is enforced downstream by mapRowToConfig() + PromptRow.
function promptsTable(client: ReturnType<typeof createAdminClient>): any {
  return (client as any).from('prompts');
}

// ============================================================================
// Loader
// ============================================================================

/**
 * Gets a prompt configuration by slug.
 * Checks cache first, then database, then falls back to seed data.
 */
export async function getPrompt(slug: string): Promise<PromptConfig> {
  // 1. Check cache
  const cached = getCached(slug);
  if (cached) return cached;

  // 2. Try database
  try {
    const supabase = createAdminClient();
    const { data, error } = await promptsTable(supabase)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      const config = mapRowToConfig(data as unknown as PromptRow);
      setCache(slug, config);
      return config;
    }
  } catch {
    // Database not available (connection error, missing env, etc.)
    // Fall through to seed data
  }

  // 3. Fall back to seed data
  const seed = getSeedPrompt(slug);
  if (seed) {
    setCache(slug, seed);
    return seed;
  }

  throw new Error(`Prompt not found: ${slug}`);
}

/**
 * Gets all active prompts (for admin listing).
 */
export async function getAllPrompts(): Promise<PromptConfig[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await promptsTable(supabase)
      .select('*')
      .eq('is_active', true)
      .order('slug', { ascending: true });

    if (!error && data && data.length > 0) {
      return (data as unknown as PromptRow[]).map(mapRowToConfig);
    }
  } catch {
    // Database not available — fall through to seed data below.
  }

  // Fall back to seed data (DB unavailable, errored, or empty)
  return PROMPT_SEEDS.map(seed => ({
    slug: seed.slug,
    name: seed.name,
    description: seed.description ?? null,
    category: seed.category ?? 'alignment',
    model: seed.model ?? 'z-ai/glm-5.2',
    temperature: parseFloat(String(seed.temperature ?? '0.3')),
    maxTokens: seed.maxTokens ?? 4096,
    systemPrompt: seed.systemPrompt,
    userPromptTemplate: seed.userPromptTemplate,
    outputSchema: seed.outputSchema ?? null,
    isActive: seed.isActive ?? true,
  }));
}

// ============================================================================
// Template Rendering
// ============================================================================

/**
 * Renders a prompt template by substituting {{variable}} placeholders.
 *
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Key-value pairs to substitute
 * @returns Rendered prompt string
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
}
