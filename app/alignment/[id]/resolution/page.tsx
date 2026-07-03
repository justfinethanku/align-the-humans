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

function isResolutionSubmissionForRound(
  response: { metadata: unknown; submitted_at: string | null },
  round: number
): boolean {
  const metadata = response.metadata as Record<string, unknown> | null;
  return (
    Boolean(response.submitted_at) &&
    metadata?.resolution_submission === true &&
    metadata?.resolution_round === round
  );
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
  const analysisDetails = analysis.details as Record<string, unknown> | null;
  const sortedParticipants = [...alignment.participants].sort((a, b) =>
    a.user_id.localeCompare(b.user_id)
  );
  const fallbackPersonAUserId = sortedParticipants[0]?.user_id;
  const personAUserId =
    typeof analysisDetails?.personAUserId === 'string'
      ? analysisDetails.personAUserId
      : fallbackPersonAUserId;
  const isCurrentUserPersonA = personAUserId === user.id;

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

  // 8. Check if user has already submitted resolution picks for this analysis round.
  // Resolution picks are stored as the next round's analysis input so they do not
  // overwrite the questionnaire answers that produced the current analysis.
  const resolutionResponseRound = alignment.current_round + 1;
  const { data: resolutionResponses } = await supabase
    .from('alignment_responses')
    .select('user_id, submitted_at, metadata')
    .eq('alignment_id', alignmentId)
    .eq('round', resolutionResponseRound);

  const submittedResolutionResponses = (resolutionResponses || []).filter((response) =>
    isResolutionSubmissionForRound(response, alignment.current_round)
  );
  const hasUserSubmitted = submittedResolutionResponses.some((response) => response.user_id === user.id);
  const hasPartnerSubmitted = submittedResolutionResponses.some((response) => response.user_id === partnerId);

  // 9. Detect the round-cap terminal state.
  // submit-resolution/route.ts never transitions status to 'analyzing' once
  // both partners have submitted at MAX_RESOLUTION_ROUNDS -- it leaves
  // current_round and status untouched. So reaching this page with status
  // still 'resolving', current_round already at the cap, and both partners
  // submitted for that analysis round is the durable, derivable signal that this
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
          alignmentStatus={alignment.status}
          isCurrentUserPersonA={isCurrentUserPersonA}
          hasUserSubmitted={hasUserSubmitted}
          hasPartnerSubmitted={hasPartnerSubmitted}
          maxRoundsReached={maxRoundsReached}
        />
      </div>
    </div>
  );
}
