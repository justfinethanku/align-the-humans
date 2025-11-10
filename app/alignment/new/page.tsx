import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { NewAlignmentClient } from './NewAlignmentClient';

/**
 * New Alignment Page (Server Component)
 *
 * Features:
 * - Server-side authentication check
 * - Redirects to login if not authenticated
 * - Renders client component for template selection
 *
 * Per plan_a.md lines 694-721:
 * - Template selection grid (6 templates)
 * - Custom description section
 * - Navigation to clarity page on selection
 */
export default async function NewAlignmentPage() {
  // Server-side auth check
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  return <NewAlignmentClient userId={user.id} />;
}
