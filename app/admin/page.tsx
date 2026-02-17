/**
 * Admin Dashboard Home Page
 * Displays key metrics and system statistics
 */

import { createServerClient } from '@/app/lib/supabase-server';

async function getAdminStats() {
  const supabase = createServerClient();

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // Get total alignments count
  const { count: totalAlignments } = await supabase
    .from('alignments')
    .select('id', { count: 'exact', head: true });

  // Get active alignments count (active, analyzing, or resolving status)
  const { count: activeAlignments } = await supabase
    .from('alignments')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'analyzing', 'resolving']);

  // Get completed alignments count
  const { count: completedAlignments } = await supabase
    .from('alignments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'complete');

  return {
    totalUsers: totalUsers ?? 0,
    totalAlignments: totalAlignments ?? 0,
    activeAlignments: activeAlignments ?? 0,
    completedAlignments: completedAlignments ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-2 text-zinc-400">
          System overview and key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered user accounts"
        />
        <StatCard
          title="Total Alignments"
          value={stats.totalAlignments}
          description="All alignment workflows"
        />
        <StatCard
          title="Active Alignments"
          value={stats.activeAlignments}
          description="In progress or resolving"
        />
        <StatCard
          title="Completed Alignments"
          value={stats.completedAlignments}
          description="Successfully finalized"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Quick Actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            href="/admin/users"
            label="Manage Users"
            description="View and manage user accounts"
          />
          <QuickActionButton
            href="/admin/alignments"
            label="View Alignments"
            description="Monitor alignment workflows"
          />
          <QuickActionButton
            href="/admin/prompts"
            label="Manage Prompts"
            description="Configure AI prompts and templates"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-zinc-100">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function QuickActionButton({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
    >
      <h3 className="font-medium text-zinc-100 group-hover:text-blue-400">
        {label}
      </h3>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </a>
  );
}
