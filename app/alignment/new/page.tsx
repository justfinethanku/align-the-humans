import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { NewAlignmentClient } from './NewAlignmentClient';

interface NewAlignmentPageProps {
  searchParams?: {
    partnerId?: string;
    partnerName?: string;
  };
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
  // Server-side auth check
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Extract partner info from URL params if provided
  const preselectedPartner = searchParams?.partnerId && searchParams?.partnerName
    ? {
        id: searchParams.partnerId,
        name: decodeURIComponent(searchParams.partnerName),
      }
    : null;

  return <NewAlignmentClient userId={user.id} preselectedPartner={preselectedPartner} />;
}
