/**
 * Prompt Management List Page
 *
 * Displays all AI prompts with key configuration details.
 * Each row links to the prompt editor.
 */

import Link from 'next/link';
import { createAdminClient } from '@/app/lib/supabase-server';

interface PromptListRow {
  slug: string;
  name: string;
  model: string;
  temperature: string | number;
  max_tokens: number;
  is_active: boolean;
  updated_at: string;
}

function promptsTable(client: ReturnType<typeof createAdminClient>): {
  select: (columns: string) => {
    order: (
      column: string,
      options: { ascending: boolean }
    ) => Promise<{ data: PromptListRow[] | null; error: { message: string } | null }>;
  };
} {
  return (client as unknown as { from: (table: string) => ReturnType<typeof promptsTable> }).from(
    'prompts'
  ) as ReturnType<typeof promptsTable>;
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export default async function PromptsPage() {
  const supabase = createAdminClient();
  const { data, error } = await promptsTable(supabase)
    .select('slug, name, model, temperature, max_tokens, is_active, updated_at')
    .order('slug', { ascending: true });

  const prompts = error || !data ? [] : data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Prompt Management</h1>
        <p className="mt-2 text-zinc-400 text-sm max-w-3xl">
          Edit model slugs, generation parameters, and prompt templates. Changes are versioned
          and go live within ~5 minutes (in-memory cache TTL).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prompts.map((prompt) => (
          <Link
            key={prompt.slug}
            href={`/admin/prompts/${prompt.slug}`}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3 gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-zinc-100 mb-1">{prompt.name}</h2>
                <code className="text-sm text-zinc-400 font-mono">{prompt.slug}</code>
              </div>
              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  prompt.is_active
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {prompt.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="md:col-span-2">
                <div className="text-zinc-500 text-xs mb-1">Model</div>
                <div className="text-zinc-300 font-mono text-xs truncate">{prompt.model}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Temperature</div>
                <div className="text-zinc-300">{parseFloat(String(prompt.temperature))}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Max Tokens</div>
                <div className="text-zinc-300">{prompt.max_tokens}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Updated</div>
                <div className="text-zinc-300 text-xs">{formatUpdatedAt(prompt.updated_at)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">No prompts found.</p>
        </div>
      )}
    </div>
  );
}