/**
 * Resolution Page - Conflict Resolution Interface
 *
 * Displays conflicts from analysis and provides resolution options:
 * - AI-suggested compromises
 * - Accept partner's position
 * - Accept own position
 * - Custom solution
 *
 * Handles multi-round resolution workflow with partner coordination.
 */

import { redirect } from 'next/navigation';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getAlignmentDetail, getAnalysis, isParticipant } from '@/app/lib/db-helpers';
import { ResolutionForm } from './resolution-form';
import type { ConflictItem } from '@/app/lib/types';

interface ResolutionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResolutionPage({ params }: ResolutionPageProps) {
  const resolvedParams = await params;
  const alignmentId = resolvedParams.id;

  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  // 1. Require authentication
  if (!user) {
    redirect('/auth/login');
  }

  // 2. Verify user is a participant
  const isUserParticipant = await isParticipant(supabase, alignmentId, user.id);
  if (!isUserParticipant) {
    redirect('/dashboard');
  }

  // 3. Get alignment details with participants and responses
  const { data: alignment, error: alignmentError } = await getAlignmentDetail(
    supabase,
    alignmentId,
    user.id
  );

  if (alignmentError || !alignment) {
    redirect('/dashboard');
  }

  // 4. Check if alignment is in resolving status
  if (alignment.status !== 'resolving') {
    // If complete, redirect to document page
    if (alignment.status === 'complete') {
      redirect(`/alignment/${alignmentId}/document`);
    }
    // If analyzing, redirect to analysis page
    if (alignment.status === 'analyzing') {
      redirect(`/alignment/${alignmentId}/analysis`);
    }
    // Otherwise back to dashboard
    redirect('/dashboard');
  }

  // 5. Get latest analysis for current round
  const { data: analysis, error: analysisError } = await getAnalysis(
    supabase,
    alignmentId,
    alignment.current_round
  );

  if (analysisError || !analysis || !analysis.summary) {
    // No analysis yet, redirect to analysis page
    redirect(`/alignment/${alignmentId}/analysis`);
  }

  // 6. Extract conflicts from analysis
  const conflicts: ConflictItem[] = analysis.summary.conflicts || [];

  // If no conflicts remain, should move to document/signature phase
  if (conflicts.length === 0) {
    redirect(`/alignment/${alignmentId}/document`);
  }

  // 7. Get partner info
  const partnerId = alignment.participants.find(p => p.user_id !== user.id)?.user_id;
  if (!partnerId) {
    redirect('/dashboard');
  }

  const { data: partnerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', partnerId)
    .single();

  const partnerName = partnerProfile?.display_name || 'Your partner';

  // 8. Check if user has already submitted resolution for this round
  const hasUserSubmitted = alignment.user_response?.submitted_at !== null;
  const hasPartnerSubmitted = alignment.partner_response?.submitted_at !== null;

  // 9. Render resolution form
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:px-6">
        <ResolutionForm
          alignmentId={alignmentId}
          conflicts={conflicts}
          currentRound={alignment.current_round}
          partnerName={partnerName}
          hasUserSubmitted={hasUserSubmitted}
          hasPartnerSubmitted={hasPartnerSubmitted}
        />
      </div>
    </div>
  );
}
