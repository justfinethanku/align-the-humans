/**
 * Admin Alignments Page
 * Lists all alignment workflows with status and participants
 */

import { createServerClient } from '@/app/lib/supabase-server';

export default async function AdminAlignmentsPage() {
  const supabase = createServerClient();

  const { data: alignments, error } = await supabase
    .from('alignments')
    .select('id, title, status, current_round, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(100);

  const alignmentList = alignments ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Alignments</h1>
        <p className="mt-2 text-zinc-400">
          Monitor all alignment workflows
        </p>
      </div>

      {/* Alignments Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Round
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {alignmentList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No alignments found
                  </td>
                </tr>
              ) : (
                alignmentList.map((alignment) => (
                  <tr
                    key={alignment.id}
                    className="transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-100">
                      {alignment.title || (
                        <span className="text-zinc-500 italic">Untitled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={alignment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {alignment.current_round}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {alignment.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {new Date(alignment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {alignmentList.length > 0 && (
          <div className="border-t border-zinc-800 px-6 py-4">
            <p className="text-sm text-zinc-400">
              Showing {alignmentList.length} alignments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-zinc-700/50 text-zinc-400',
    active: 'bg-blue-500/10 text-blue-400',
    analyzing: 'bg-yellow-500/10 text-yellow-400',
    resolving: 'bg-orange-500/10 text-orange-400',
    complete: 'bg-green-500/10 text-green-400',
  };

  const colorClass = colors[status] || 'bg-zinc-700/50 text-zinc-400';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}
