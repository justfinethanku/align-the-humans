/**
 * Alignment Detail Router
 *
 * Redirects to the appropriate step based on alignment status.
 * Status → Route mapping:
 *   draft     → /clarity
 *   active    → /questions
 *   analyzing → /analysis
 *   resolving → /resolution
 *   complete  → /document
 */

import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlignmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect(`/login?redirectTo=/alignment/${id}`);
  }

  const { data: alignment, error } = await getAlignmentDetail(supabase, id, user.id);

  if (error || !alignment) {
    redirect('/dashboard');
  }

  // Route to the correct step based on status
  switch (alignment.status) {
    case 'draft':
      redirect(`/alignment/${id}/clarity`);
    case 'active':
      // A user who already submitted must not be sent back into the
      // questionnaire (answers would be editable post-submit).
      if (alignment.user_response?.submitted_at) {
        redirect(`/alignment/${id}/waiting`);
      }
      redirect(`/alignment/${id}/questions`);
    case 'analyzing':
      redirect(`/alignment/${id}/analysis`);
    case 'resolving':
      redirect(`/alignment/${id}/resolution`);
    case 'complete':
      redirect(`/alignment/${id}/document`);
    default:
      redirect(`/alignment/${id}/clarity`);
  }
}
