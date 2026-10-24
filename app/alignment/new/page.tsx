import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { NewAlignmentClient } from './NewAlignmentClient';

interface NewAlignmentPageProps {
  searchParams: Promise<{
    partnerId?: string;
    partnerName?: string;
  }>;
}

/**
 * New Alignment Page (Server Component)
 *
 * Features:
 * - Server-side authentication check
 * - Redirects to login if not authenticated
 * - Renders client component for template selection
 * - Supports pre-selected partner via URL params
 *
 * Per plan_a.md lines 694-721:
 * - Template selection grid (6 templates)
 * - Custom description section
 * - Navigation to clarity page on selection
 */
export default async function NewAlignmentPage({ searchParams }: NewAlignmentPageProps) {
  const { partnerId, partnerName } = await searchParams;
  // Server-side auth check
  const supabase = await createServerClient();
  const user = await getCurrentUser(supabase);

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Extract partner info from URL params if provided
  const preselectedPartner = partnerId && partnerName
    ? {
        id: partnerId,
        name: decodeURIComponent(partnerName),
      }
    : null;

  return <NewAlignmentClient userId={user.id} preselectedPartner={preselectedPartner} />;
}
