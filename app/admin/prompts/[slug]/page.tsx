/**
 * Prompt Detail Page
 *
 * Loads a prompt and its recent version history, then renders the editor.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/app/lib/supabase-server';
import {
  PromptEditor,
  type PromptEditorData,
  type PromptVersionHistoryItem,
} from './prompt-editor';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface PromptDetailRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  model: string;
  temperature: string | number;
  max_tokens: number;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
}

interface PromptVersionRow {
  version: number;
  model: string;
  created_at: string;
  change_note: string | null;
}

function untypedTable(client: ReturnType<typeof createAdminClient>, table: string): any {
  return (client as any).from(table);
}

export default async function PromptDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: promptRow, error: promptError } = await untypedTable(admin, 'prompts')
    .select(
      'id, slug, name, description, model, temperature, max_tokens, system_prompt, user_prompt_template, is_active'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (promptError || !promptRow) {
    notFound();
  }

  const row = promptRow as PromptDetailRow;

  const { data: versionRows, error: versionsError } = await untypedTable(admin, 'prompt_versions')
    .select('version, model, created_at, change_note')
    .eq('prompt_id', row.id)
    .order('version', { ascending: false })
    .limit(10);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const prompt: PromptEditorData = {
    slug: row.slug,
    name: row.name,
    description: row.description,
    model: row.model,
    temperature: parseFloat(String(row.temperature)),
    maxTokens: row.max_tokens,
    systemPrompt: row.system_prompt,
    userPromptTemplate: row.user_prompt_template,
    isActive: row.is_active,
  };

  const versions: PromptVersionHistoryItem[] = ((versionRows ?? []) as PromptVersionRow[]).map(
    (version) => ({
      version: version.version,
      model: version.model,
      createdAt: version.created_at,
      changeNote: version.change_note,
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/prompts"
          className="text-zinc-400 hover:text-zinc-300 text-sm"
        >
          &larr; Back to Prompts
        </Link>
      </div>

      <div>
        <div className="flex items-start justify-between mb-2 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-1">{prompt.name}</h1>
            <code className="text-sm text-zinc-400 font-mono">{prompt.slug}</code>
          </div>
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              prompt.isActive
                ? 'bg-green-900/50 text-green-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {prompt.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {prompt.description ? (
          <p className="text-zinc-400 mt-2">{prompt.description}</p>
        ) : null}
      </div>

      <PromptEditor prompt={prompt} versions={versions} />
    </div>
  );
}