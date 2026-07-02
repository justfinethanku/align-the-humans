'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clearPromptCache } from '@/app/lib/prompts';
import { createAdminClient, createServerClient, getCurrentUser } from '@/app/lib/supabase-server';

const updatePromptInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  model: z.string().trim().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(64000),
  systemPrompt: z.string().min(1),
  userPromptTemplate: z.string().min(1),
  isActive: z.boolean(),
  changeNote: z.string().optional(),
});

export type UpdatePromptInput = z.infer<typeof updatePromptInputSchema>;

interface PromptRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  model: string;
  temperature: string | number;
  max_tokens: number;
  system_prompt: string;
  user_prompt_template: string;
  output_schema: unknown;
  is_active: boolean;
}

function untypedTable(client: ReturnType<typeof createAdminClient>, table: string): any {
  return (client as any).from(table);
}

async function requireAdminUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return { ok: false, error: 'Not authenticated' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_admin) {
    return { ok: false, error: 'Not authorized' };
  }

  return { ok: true, userId: user.id };
}

function getChangedFields(current: PromptRow, input: UpdatePromptInput): string[] {
  const changed: string[] = [];

  if (current.name !== input.name) changed.push('name');
  if ((current.description ?? '') !== (input.description ?? '')) changed.push('description');
  if (current.model !== input.model) changed.push('model');
  if (parseFloat(String(current.temperature)) !== input.temperature) changed.push('temperature');
  if (current.max_tokens !== input.maxTokens) changed.push('max_tokens');
  if (current.system_prompt !== input.systemPrompt) changed.push('system_prompt');
  if (current.user_prompt_template !== input.userPromptTemplate) {
    changed.push('user_prompt_template');
  }
  if (current.is_active !== input.isActive) changed.push('is_active');

  return changed;
}

export async function updatePromptAction(
  slug: string,
  input: UpdatePromptInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = updatePromptInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const data = parsed.data;
  const admin = createAdminClient();

  const { data: current, error: loadError } = await untypedTable(admin, 'prompts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message };
  }

  if (!current) {
    return { ok: false, error: 'Prompt not found' };
  }

  const currentRow = current as PromptRow;

  const { data: maxVersionRow, error: versionLookupError } = await untypedTable(
    admin,
    'prompt_versions'
  )
    .select('version')
    .eq('prompt_id', currentRow.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionLookupError) {
    return { ok: false, error: versionLookupError.message };
  }

  const nextVersion = ((maxVersionRow?.version as number | undefined) ?? 0) + 1;
  const changedFields = getChangedFields(currentRow, data);

  const { error: versionInsertError } = await untypedTable(admin, 'prompt_versions').insert({
    prompt_id: currentRow.id,
    version: nextVersion,
    model: data.model,
    temperature: data.temperature,
    max_tokens: data.maxTokens,
    system_prompt: data.systemPrompt,
    user_prompt_template: data.userPromptTemplate,
    output_schema: currentRow.output_schema,
    change_note: data.changeNote?.trim() || null,
    created_by: auth.userId,
  });

  if (versionInsertError) {
    return { ok: false, error: versionInsertError.message };
  }

  const { error: updateError } = await untypedTable(admin, 'prompts')
    .update({
      name: data.name,
      description: data.description?.trim() || null,
      model: data.model,
      temperature: data.temperature,
      max_tokens: data.maxTokens,
      system_prompt: data.systemPrompt,
      user_prompt_template: data.userPromptTemplate,
      is_active: data.isActive,
    })
    .eq('id', currentRow.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await untypedTable(admin, 'admin_audit_log').insert({
    admin_id: auth.userId,
    action: 'prompt.update',
    target_type: 'prompt',
    target_id: currentRow.id,
    details: {
      slug,
      version: nextVersion,
      changedFields,
    },
  });

  clearPromptCache();
  revalidatePath('/admin/prompts');
  revalidatePath(`/admin/prompts/${slug}`);

  return { ok: true };
}