/**
 * Admin Layout Component
 * Provides sidebar navigation for admin dashboard
 * Requires admin privileges - redirects non-admins to dashboard
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/app/lib/supabase-server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for Human Alignment',
  robots: {
    index: false,
    follow: false,
  },
};

async function checkAdminAccess() {
  const supabase = createServerClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirectTo=/admin');
  }

  // Check if user has admin privileges
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    redirect('/dashboard');
  }

  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAdminAccess();

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8">
                <svg
                  fill="currentColor"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                >
                  <g clipPath="url(#clip0_6_319)">
                    <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_319">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-100">Admin</h1>
                <p className="text-xs text-zinc-400">Human Alignment</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <NavItem href="/admin" label="Dashboard" />
              <NavItem href="/admin/users" label="Users" />
              <NavItem href="/admin/alignments" label="Alignments" />
              <NavItem href="/admin/prompts" label="Prompts" />
              <NavItem href="/admin/system" label="System" />
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-zinc-800 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
      >
        {label}
      </Link>
    </li>
  );
}
