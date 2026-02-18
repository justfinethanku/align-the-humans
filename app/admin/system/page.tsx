/**
 * Admin System Page
 * Displays available AI models and system configuration
 */

import { discoverModels, AI_MODELS } from '@/app/lib/ai-config';

export default async function AdminSystemPage() {
  let models: { id: string; owned_by: string }[] = [];
  let source = 'defaults';

  try {
    const discovered = await discoverModels();
    models = discovered;
    source = process.env.AI_GATEWAY_API_KEY ? 'gateway' : 'defaults';
  } catch {
    source = 'error';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">System</h1>
        <p className="mt-2 text-zinc-400">
          AI model configuration and system health
        </p>
      </div>

      {/* Active Model Config */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Active Model Configuration
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-sm text-zinc-400 mb-1">Primary (Analysis &amp; Generation)</div>
            <code className="text-sm text-zinc-100 font-mono">{AI_MODELS.SONNET}</code>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-sm text-zinc-400 mb-1">Fast (Suggestions &amp; Clarity)</div>
            <code className="text-sm text-zinc-100 font-mono">{AI_MODELS.HAIKU}</code>
          </div>
        </div>
      </div>

      {/* AI Gateway Models */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-100">
            Available Models
          </h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              source === 'gateway'
                ? 'bg-green-500/10 text-green-400'
                : source === 'defaults'
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-red-500/10 text-red-400'
            }`}
          >
            {source === 'gateway' ? 'AI Gateway' : source === 'defaults' ? 'Defaults' : 'Error'}
          </span>
        </div>

        {source !== 'gateway' && (
          <p className="text-sm text-zinc-400 mb-4">
            {source === 'defaults'
              ? 'AI Gateway API key not configured. Showing default models only. Set AI_GATEWAY_API_KEY to enable dynamic model discovery.'
              : 'Failed to connect to AI Gateway.'}
          </p>
        )}

        {/* Group models by provider */}
        <div className="space-y-4">
          {groupByProvider(models).map(([provider, providerModels]) => (
            <div key={provider}>
              <h3 className="text-sm font-medium text-zinc-400 mb-2 capitalize">
                {provider} ({providerModels.length})
              </h3>
              <div className="grid gap-2">
                {providerModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-4 py-2"
                  >
                    <code className="text-sm text-zinc-200 font-mono">{model.id}</code>
                    <span className="text-xs text-zinc-500">{model.owned_by}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {models.length === 0 && (
          <p className="text-sm text-zinc-500 py-4 text-center">
            No models available
          </p>
        )}
      </div>

      {/* Environment Info */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Environment</h2>
        <div className="space-y-2 text-sm">
          <EnvRow label="AI Gateway" value={process.env.AI_GATEWAY_API_KEY ? 'Configured' : 'Not configured'} />
          <EnvRow label="Supabase URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured'} />
          <EnvRow label="Database URL" value={process.env.DATABASE_URL ? 'Configured' : 'Not configured'} />
          <EnvRow label="Resend API" value={process.env.RESEND_API_KEY ? 'Configured' : 'Not configured'} />
          <EnvRow label="Node Env" value={process.env.NODE_ENV ?? 'unknown'} />
        </div>
      </div>
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  const isConfigured = value === 'Configured';
  return (
    <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-4 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className={isConfigured ? 'text-green-400' : 'text-zinc-500'}>
        {value}
      </span>
    </div>
  );
}

function groupByProvider(
  models: { id: string; owned_by: string }[]
): [string, { id: string; owned_by: string }[]][] {
  const groups = new Map<string, { id: string; owned_by: string }[]>();

  for (const model of models) {
    const provider = model.id.includes('/')
      ? model.id.split('/')[0]
      : model.owned_by;
    const existing = groups.get(provider) ?? [];
    existing.push(model);
    groups.set(provider, existing);
  }

  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
