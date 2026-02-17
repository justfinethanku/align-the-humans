/**
 * Prompt Detail Page
 *
 * Displays full configuration for a single prompt.
 * Read-only view - edit functionality to be added later.
 */

import Link from 'next/link';
import { getAllPrompts } from '@/app/lib/prompts';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromptDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const prompts = await getAllPrompts();
  const prompt = prompts.find((p) => p.slug === slug);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/prompts"
          className="text-zinc-400 hover:text-zinc-300 text-sm"
        >
          &larr; Back to Prompts
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-1">{prompt.name}</h1>
            <code className="text-sm text-zinc-400 font-mono">
              {prompt.slug}
            </code>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              prompt.isActive
                ? 'bg-green-900/50 text-green-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {prompt.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {prompt.description && (
          <p className="text-zinc-400 mt-2">{prompt.description}</p>
        )}
      </div>

      {/* Configuration Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-100">
          Configuration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-zinc-500 text-sm mb-1">Category</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-400">
              {prompt.category}
            </span>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Model</div>
            <div className="text-zinc-300 font-mono text-sm">
              {prompt.model}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Temperature</div>
            <div className="text-zinc-300">{prompt.temperature}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Max Tokens</div>
            <div className="text-zinc-300">{prompt.maxTokens}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Status</div>
            <div className="text-zinc-300">
              {prompt.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 text-zinc-100">
          System Prompt
        </h2>
        <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
          {prompt.systemPrompt}
        </pre>
      </div>

      {/* User Prompt Template */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 text-zinc-100">
          User Prompt Template
        </h2>
        <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
          {prompt.userPromptTemplate}
        </pre>
      </div>

      {/* Output Schema */}
      {prompt.outputSchema ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-zinc-100">
            Output Schema
          </h2>
          <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(prompt.outputSchema, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
