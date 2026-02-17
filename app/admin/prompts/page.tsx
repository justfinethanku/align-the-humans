/**
 * Prompt Management List Page
 *
 * Displays all AI prompts with key configuration details.
 * Server component that fetches prompts via getAllPrompts().
 */

import Link from 'next/link';
import { getAllPrompts } from '@/app/lib/prompts';

export default async function PromptsPage() {
  const prompts = await getAllPrompts();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Prompt Management</h1>
        <p className="mt-2 text-zinc-400 text-sm max-w-3xl">
          The prompt system centralizes all AI interactions in the Human Alignment app.
          Each prompt configuration defines model parameters, system instructions, and user prompt templates
          with variable substitution. Prompts are loaded from the database with in-memory caching and
          fall back to seed data when the database is unavailable.
        </p>
      </div>

      {/* Prompt Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {prompts.map((prompt) => (
          <Link
            key={prompt.slug}
            href={`/admin/prompts/${prompt.slug}`}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                  {prompt.name}
                </h2>
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
              <p className="text-zinc-400 text-sm mb-4">{prompt.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 text-xs mb-1">Category</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-400">
                  {prompt.category}
                </span>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Model</div>
                <div className="text-zinc-300 font-mono text-xs">
                  {prompt.model}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Temperature</div>
                <div className="text-zinc-300">{prompt.temperature}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Max Tokens</div>
                <div className="text-zinc-300">{prompt.maxTokens}</div>
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
