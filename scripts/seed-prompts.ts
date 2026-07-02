/**
 * Seed/refresh the prompts table from PROMPT_SEEDS.
 * Run: npx tsx --env-file=.env.local scripts/seed-prompts.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PROMPT_SEEDS } from '../app/lib/db/seed-prompts';

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Run with: npx tsx --env-file=.env.local scripts/seed-prompts.ts'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = PROMPT_SEEDS.map((seed) => ({
    slug: seed.slug,
    name: seed.name,
    description: seed.description ?? null,
    category: seed.category ?? 'alignment',
    model: seed.model ?? 'z-ai/glm-5.2',
    temperature: parseFloat(String(seed.temperature ?? '0.3')),
    max_tokens: seed.maxTokens ?? 4096,
    system_prompt: seed.systemPrompt,
    user_prompt_template: seed.userPromptTemplate,
    output_schema: seed.outputSchema ?? null,
    is_active: seed.isActive ?? true,
  }));

  const { data, error } = await supabase
    .from('prompts')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug');

  if (error) {
    console.error(`Failed to seed prompts: ${error.message}`);
    process.exit(1);
  }

  console.log(`Seeded ${data?.length ?? 0} prompts (${PROMPT_SEEDS.length} in PROMPT_SEEDS).`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});