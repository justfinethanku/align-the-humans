import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import {
  fetchDashboardAlignments,
  fetchDashboardPartners,
} from '@/app/lib/dashboard-data';
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

  const [profileResult, entitlementResult, initialAlignments, initialPartners] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('account_entitlements')
      .select('free_alignment_claimed_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    fetchDashboardAlignments(supabase, user.id),
    fetchDashboardPartners(supabase, user.id),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email || ''}
      displayName={profileResult.data?.display_name || null}
      initialFreeAlignmentClaimed={Boolean(entitlementResult.data?.free_alignment_claimed_at)}
      initialAlignments={initialAlignments}
      initialPartners={initialPartners}
    />
  );
}
