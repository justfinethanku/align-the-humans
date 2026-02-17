/**
 * Waiting Page - Shown after a participant submits their responses
 * Displays submission status for both participants and auto-redirects
 * when both have submitted and analysis begins.
 */

import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';
import { WaitingClient } from './waiting-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WaitingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    const redirectParam = encodeURIComponent(`/alignment/${id}/waiting`);
    redirect(`/login?redirectTo=${redirectParam}`);
  }

  const { data: alignment, error } = await getAlignmentDetail(
    supabase,
    id,
    user.id
  );

  if (error || !alignment) {
    redirect('/dashboard');
  }

  // If already past active status, redirect to appropriate page
  if (alignment.status === 'analyzing' || alignment.status === 'resolving') {
    redirect(`/alignment/${id}/analysis`);
  }
  if (alignment.status === 'complete') {
    redirect(`/alignment/${id}/document`);
  }
  if (alignment.status === 'draft') {
    redirect(`/alignment/${id}/clarity`);
  }

  // Check if current user has submitted
  const userHasSubmitted = !!alignment.user_response?.submitted_at;

  // If user hasn't submitted, send them back to questions
  if (!userHasSubmitted) {
    redirect(`/alignment/${id}/questions`);
  }

  // Check if partner has submitted
  const partnerHasSubmitted = !!alignment.partner_response?.submitted_at;

  // Get partner name
  const partnerParticipant = alignment.participants.find(
    (p) => p.user_id !== user.id
  );
  let partnerName = 'Your partner';
  if (partnerParticipant) {
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', partnerParticipant.user_id)
      .single();
    partnerName = partnerProfile?.display_name || 'Your partner';
  }

  return (
    <WaitingClient
      alignmentId={id}
      alignmentTitle={alignment.title || 'Alignment'}
      partnerName={partnerName}
      initialPartnerSubmitted={partnerHasSubmitted}
      hasPartnerJoined={!!partnerParticipant}
    />
  );
}
