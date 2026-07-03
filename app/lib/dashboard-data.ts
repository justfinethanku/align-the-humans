import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/database.types';
import { DatabaseError } from '@/app/lib/errors';
import type {
  AlignmentStatus,
  ClarityDraft,
  Partner,
  Profile,
  UIStatus,
} from '@/app/lib/types';

type DashboardParticipant = {
  id: string;
  user_id: string;
  role: 'owner' | 'partner';
  created_at: string;
};

type AlignmentRowWithParticipants =
  Database['public']['Tables']['alignments']['Row'] & {
    participants?: Array<{
      id: string;
      user_id: string;
      role: string;
      created_at: string;
    }> | null;
  };

type DashboardAnalysis = {
  round: number;
  summary: unknown;
};

export interface AlignmentWithStatus {
  id: string;
  partner_id: string | null;
  template_id: string | null;
  status: AlignmentStatus;
  ui_status: AlignmentStatus | UIStatus;
  current_round: number;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  clarity_draft?: ClarityDraft | null;
  participant_count: number;
  submitted_count: number;
  submitted_responses: number;
  signed_count: number;
  participants: DashboardParticipant[];
}

export interface PartnerWithCount extends Partner {
  alignment_count: number;
  partner_user_id: string;
  profile: Profile | null;
}

export type DashboardStatusInput = {
  status: AlignmentStatus;
  current_round: number;
  updated_at: string;
  participant_count: number;
  submitted_count: number;
  signed_count: number;
  latest_analysis: DashboardAnalysis | null;
};

const ALIGNMENT_STATUSES: AlignmentStatus[] = [
  'draft',
  'active',
  'analyzing',
  'resolving',
  'complete',
];

function isAlignmentStatus(status: string): status is AlignmentStatus {
  return ALIGNMENT_STATUSES.includes(status as AlignmentStatus);
}

function normalizeAlignmentStatus(status: string): AlignmentStatus {
  return isAlignmentStatus(status) ? status : 'draft';
}

function normalizeParticipants(
  participants: AlignmentRowWithParticipants['participants']
): DashboardParticipant[] {
  return (participants || []).map((participant) => ({
    id: participant.id,
    user_id: participant.user_id,
    role: participant.role === 'partner' ? 'partner' : 'owner',
    created_at: participant.created_at,
  }));
}

function countByAlignmentRound(
  rows: Array<{ alignment_id: string; round: number }>
): Map<string, number> {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = `${row.alignment_id}:${row.round}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
}

export function hasZeroCurrentRoundConflicts(input: DashboardStatusInput): boolean {
  if (!input.latest_analysis || input.latest_analysis.round !== input.current_round) {
    return false;
  }

  const summary = input.latest_analysis.summary as { conflicts?: unknown } | null;
  return Array.isArray(summary?.conflicts) && summary.conflicts.length === 0;
}

export function deriveDashboardUiStatus(
  input: DashboardStatusInput
): AlignmentStatus | UIStatus {
  if (input.status === 'complete') return 'complete';

  const zeroConflicts = hasZeroCurrentRoundConflicts(input);
  const signaturesPending =
    input.participant_count > 0 &&
    input.signed_count < input.participant_count;

  if (input.status === 'resolving' && zeroConflicts && signaturesPending) {
    return 'aligned_awaiting_signatures';
  }

  if (input.status === 'resolving') return 'in_conflict_resolution';

  if (
    input.status === 'active' &&
    input.submitted_count > 0 &&
    input.submitted_count < input.participant_count
  ) {
    return 'waiting_partner';
  }

  if (new Date(input.updated_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) {
    return 'stalled';
  }

  return input.status;
}

export async function fetchDashboardAlignments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AlignmentWithStatus[]> {
  const { data: userParticipations, error: participationError } = await supabase
    .from('alignment_participants')
    .select('alignment_id')
    .eq('user_id', userId);

  if (participationError) {
    throw new DatabaseError('Failed to fetch user participations', {
      cause: participationError,
      userId,
    });
  }

  const alignmentIds = Array.from(
    new Set((userParticipations || []).map((participation) => participation.alignment_id))
  );

  if (alignmentIds.length === 0) {
    return [];
  }

  const { data: alignmentsData, error: alignmentsError } = await supabase
    .from('alignments')
    .select(`
      *,
      participants:alignment_participants(
        id,
        user_id,
        role,
        created_at
      )
    `)
    .in('id', alignmentIds)
    .order('updated_at', { ascending: false });

  if (alignmentsError) {
    throw new DatabaseError('Failed to fetch alignments with status', {
      cause: alignmentsError,
      userId,
    });
  }

  const alignments = (alignmentsData || []) as AlignmentRowWithParticipants[];

  if (alignments.length === 0) {
    return [];
  }

  const currentRounds = Array.from(
    new Set(alignments.map((alignment) => alignment.current_round))
  );

  const [
    submittedResponsesResult,
    signaturesResult,
    analysesResult,
  ] = await Promise.all([
    supabase
      .from('alignment_responses')
      .select('alignment_id, round, submitted_at')
      .in('alignment_id', alignmentIds)
      .in('round', currentRounds)
      .not('submitted_at', 'is', null),
    supabase
      .from('alignment_signatures')
      .select('alignment_id, round, user_id')
      .in('alignment_id', alignmentIds)
      .in('round', currentRounds),
    supabase
      .from('alignment_analyses')
      .select('alignment_id, round, summary, created_at')
      .in('alignment_id', alignmentIds)
      .in('round', currentRounds)
      .order('created_at', { ascending: false }),
  ]);

  if (submittedResponsesResult.error) {
    throw new DatabaseError('Failed to fetch submitted response counts', {
      cause: submittedResponsesResult.error,
      userId,
    });
  }

  if (signaturesResult.error) {
    throw new DatabaseError('Failed to fetch signature counts', {
      cause: signaturesResult.error,
      userId,
    });
  }

  if (analysesResult.error) {
    throw new DatabaseError('Failed to fetch alignment analyses', {
      cause: analysesResult.error,
      userId,
    });
  }

  const submittedCounts = countByAlignmentRound(
    submittedResponsesResult.data || []
  );
  const signatureCounts = countByAlignmentRound(signaturesResult.data || []);
  const analysesByAlignmentRound = new Map<string, DashboardAnalysis>();

  (analysesResult.data || []).forEach((analysis) => {
    const key = `${analysis.alignment_id}:${analysis.round}`;
    if (!analysesByAlignmentRound.has(key)) {
      analysesByAlignmentRound.set(key, {
        round: analysis.round,
        summary: analysis.summary,
      });
    }
  });

  return alignments.map((alignment) => {
    const status = normalizeAlignmentStatus(alignment.status);
    const participants = normalizeParticipants(alignment.participants);
    const alignmentRoundKey = `${alignment.id}:${alignment.current_round}`;
    const participantCount = participants.length;
    const submittedCount = submittedCounts.get(alignmentRoundKey) || 0;
    const signedCount = signatureCounts.get(alignmentRoundKey) || 0;
    const latestAnalysis = analysesByAlignmentRound.get(alignmentRoundKey) || null;

    return {
      id: alignment.id,
      partner_id: alignment.partner_id,
      template_id: alignment.template_id,
      status,
      ui_status: deriveDashboardUiStatus({
        status,
        current_round: alignment.current_round,
        updated_at: alignment.updated_at,
        participant_count: participantCount,
        submitted_count: submittedCount,
        signed_count: signedCount,
        latest_analysis: latestAnalysis,
      }),
      current_round: alignment.current_round,
      title: alignment.title,
      created_by: alignment.created_by,
      created_at: alignment.created_at,
      updated_at: alignment.updated_at,
      clarity_draft: alignment.clarity_draft as ClarityDraft | null,
      participant_count: participantCount,
      submitted_count: submittedCount,
      submitted_responses: submittedCount,
      signed_count: signedCount,
      participants,
    };
  });
}

export async function fetchDashboardPartners(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PartnerWithCount[]> {
  const { data: myParticipations, error: participationsError } = await supabase
    .from('alignment_participants')
    .select('alignment_id')
    .eq('user_id', userId);

  if (participationsError) {
    throw new DatabaseError('Failed to fetch user participations', {
      cause: participationsError,
      userId,
    });
  }

  if (!myParticipations || myParticipations.length === 0) {
    return [];
  }

  const alignmentIds = Array.from(
    new Set(myParticipations.map((participation) => participation.alignment_id))
  );

  const { data: otherParticipants, error: otherParticipantsError } = await supabase
    .from('alignment_participants')
    .select('user_id, alignment_id')
    .in('alignment_id', alignmentIds)
    .neq('user_id', userId);

  if (otherParticipantsError) {
    throw new DatabaseError('Failed to fetch other participants', {
      cause: otherParticipantsError,
      userId,
    });
  }

  if (!otherParticipants || otherParticipants.length === 0) {
    return [];
  }

  const partnerMap = new Map<
    string,
    { user_id: string; alignment_count: number; alignment_ids: string[] }
  >();

  otherParticipants.forEach((participant) => {
    const existing = partnerMap.get(participant.user_id);

    if (existing) {
      existing.alignment_count += 1;
      existing.alignment_ids.push(participant.alignment_id);
      return;
    }

    partnerMap.set(participant.user_id, {
      user_id: participant.user_id,
      alignment_count: 1,
      alignment_ids: [participant.alignment_id],
    });
  });

  const partnerUserIds = Array.from(partnerMap.keys());
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin, created_at, updated_at')
    .in('id', partnerUserIds);

  if (profilesError) {
    throw new DatabaseError('Failed to fetch partner profiles', {
      cause: profilesError,
      userId,
      partnerUserIds,
    });
  }

  const { data: alignmentsData, error: alignmentsError } = await supabase
    .from('alignments')
    .select('id, partner_id, created_at, updated_at, created_by')
    .in('id', alignmentIds);

  if (alignmentsError) {
    throw new DatabaseError('Failed to fetch alignments', {
      cause: alignmentsError,
      userId,
    });
  }

  const uniquePartnerIds = new Set(
    (alignmentsData || [])
      .map((alignment) => alignment.partner_id)
      .filter((id): id is string => typeof id === 'string')
  );

  if (uniquePartnerIds.size === 0) {
    return [];
  }

  const { data: partnersData, error: partnersError } = await supabase
    .from('partners')
    .select('*')
    .in('id', Array.from(uniquePartnerIds));

  if (partnersError) {
    throw new DatabaseError('Failed to fetch partner records', {
      cause: partnersError,
      userId,
    });
  }

  const partnerIdToUserId = new Map<string, string>();
  alignmentsData?.forEach((alignment) => {
    const otherParticipant = otherParticipants.find(
      (participant) => participant.alignment_id === alignment.id
    );

    if (otherParticipant && typeof alignment.partner_id === 'string') {
      partnerIdToUserId.set(alignment.partner_id, otherParticipant.user_id);
    }
  });

  const partnersWithDetails: PartnerWithCount[] = (partnersData || [])
    .map((partner) => {
      const partnerUserId = partnerIdToUserId.get(partner.id);
      const partnerInfo = partnerUserId ? partnerMap.get(partnerUserId) : null;
      const profile = profiles?.find((item) => item.id === partnerUserId) || null;

      return {
        ...partner,
        alignment_count: partnerInfo?.alignment_count || 0,
        partner_user_id: partnerUserId || '',
        profile,
      };
    })
    .filter((partner) => partner.partner_user_id);

  partnersWithDetails.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return partnersWithDetails;
}
