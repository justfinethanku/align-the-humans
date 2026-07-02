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
import { MAX_RESOLUTION_ROUNDS } from '@/app/lib/resolution-config';
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
    const redirectParam = encodeURIComponent(`/alignment/${alignmentId}/resolution`);
    redirect(`/login?redirectTo=${redirectParam}`);
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
  //
  // NOTE: `!== null` here is deliberately NOT used -- `alignment.user_response`
  // and `alignment.partner_response` are `undefined` (not `null`) whenever no
  // response row exists yet for this round (see getAlignmentDetail() in
  // app/lib/db-helpers.ts, which does `userResponse || undefined`). Since
  // `undefined !== null` is `true` in JS, a naive `!== null` check would make
  // both flags incorrectly evaluate to `true` on every fresh round before
  // anyone has submitted anything -- which would immediately show the
  // "waiting for partner" screen instead of the resolution form, and would
  // make the round-cap detection below misfire after only one partner
  // submits. Boolean(...) correctly treats "no response row yet" as false.
  const hasUserSubmitted = Boolean(alignment.user_response?.submitted_at);
  const hasPartnerSubmitted = Boolean(alignment.partner_response?.submitted_at);

  // 9. Detect the round-cap terminal state.
  // submit-resolution/route.ts never transitions status to 'analyzing' once
  // both partners have submitted at MAX_RESOLUTION_ROUNDS -- it leaves
  // current_round and status untouched. So reaching this page with status
  // still 'resolving', current_round already at the cap, and both partners
  // submitted for that round is the durable, derivable signal that this
  // alignment has exhausted its resolution rounds.
  const maxRoundsReached =
    hasUserSubmitted &&
    hasPartnerSubmitted &&
    alignment.current_round >= MAX_RESOLUTION_ROUNDS;

  // 10. Render resolution form
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:px-6">
        <ResolutionForm
          alignmentId={alignmentId}
          conflicts={conflicts}
          currentRound={alignment.current_round}
          maxRounds={MAX_RESOLUTION_ROUNDS}
          partnerName={partnerName}
          hasUserSubmitted={hasUserSubmitted}
          hasPartnerSubmitted={hasPartnerSubmitted}
          maxRoundsReached={maxRoundsReached}
        />
      </div>
    </div>
  );
}
