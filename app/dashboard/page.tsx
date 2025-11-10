import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { DashboardClient } from './DashboardClient';

/**
 * Dashboard Page (Server Component)
 *
 * Features:
 * - Server-side authentication check
 * - Redirects to login if not authenticated
 * - Fetches initial user profile data
 * - Renders client component for interactive features
 *
 * Per plan_a.md lines 653-692:
 * - Current Alignments section with grid
 * - Your Partners section with list
 * - Empty states
 * - Loading states handled by client component
 */
export default async function DashboardPage() {
  // Server-side auth check
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile for header display
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email || ''}
      displayName={profile?.display_name || null}
    />
  );
}
