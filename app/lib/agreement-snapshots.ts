import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import type {
  AnalysisSummary,
  CanonicalSnapshot,
  CanonicalSnapshotHashInput,
  DocumentSection,
  ParticipantRole,
  ResponseAnswers,
} from './types';
import { AlignmentError } from './errors';
import { getPrompt } from './prompts';
import { renderAgreementDocument } from './agreement-document';

type SupabaseClientType = SupabaseClient<Database>;
type AlignmentRow = Database['public']['Tables']['alignments']['Row'];
type AnalysisRow = Database['public']['Tables']['alignment_analyses']['Row'];
type ParticipantRow = Database['public']['Tables']['alignment_participants']['Row'];
type ResponseRow = Database['public']['Tables']['alignment_responses']['Row'];
type SnapshotRow = Database['public']['Tables']['alignment_agreement_snapshots']['Row'];
type TemplateRow = Database['public']['Tables']['templates']['Row'];

export interface AgreementSnapshotView {
  id: string | null;
  hash: string;
  snapshot: CanonicalSnapshot;
  documentHtml: string;
  documentSections: DocumentSection[];
  documentInputs: CanonicalSnapshot['document']['inputs'];
  isFrozen: boolean;
}

interface DocumentPromptSource {
  id: string | null;
  updatedAt: string | null;
  skeletonHtml: string;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortStable(value)) ?? 'null';
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortStable);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const item = (value as Record<string, unknown>)[key];
        if (item !== undefined) {
          acc[key] = sortStable(item);
        }
        return acc;
      }, {});
  }

  return value;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function roleOrder(role: string): number {
  return role === 'owner' ? 0 : 1;
}

function assertParticipantRole(role: string): ParticipantRole {
  if (role !== 'owner' && role !== 'partner') {
    throw new AlignmentError('Invalid participant role on alignment', 'ALIGNMENT_PARTICIPANT_ROLE_INVALID', 500, {
      role,
    });
  }
  return role;
}

function formatDocumentDate(createdAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(createdAt));
}

function getTemplateCategory(template: TemplateRow | null): string {
  const metadata = template?.content && typeof template.content === 'object'
    ? (template.content as Record<string, unknown>).metadata
    : null;

  if (metadata && typeof metadata === 'object') {
    const category = (metadata as Record<string, unknown>).category;
    if (typeof category === 'string' && category.trim().length > 0) {
      return category;
    }
  }

  return 'General Agreement';
}

function getAgreements(summary: AnalysisSummary): AnalysisSummary['agreements'] {
  return Array.isArray(summary.agreements) ? summary.agreements : [];
}

function getSummaryPoints(summary: AnalysisSummary): string[] {
  const points = getAgreements(summary)
    .slice(0, 5)
    .map((agreement) => agreement.description)
    .filter((description): description is string => typeof description === 'string' && description.length > 0);

  return points.length > 0 ? points : ['Agreement reached on all key terms'];
}

function getFinalPositions(summary: AnalysisSummary): Record<string, unknown> {
  return getAgreements(summary).reduce<Record<string, unknown>>((acc, agreement, index) => {
    acc[`term_${index + 1}`] = {
      description: agreement.description,
      value: agreement.shared_value,
    };
    return acc;
  }, {});
}

async function loadDocumentPromptSource(supabase: SupabaseClientType): Promise<DocumentPromptSource> {
  try {
    const { data, error } = await (supabase as any)
      .from('prompts')
      .select('id, updated_at, user_prompt_template')
      .eq('slug', 'document-skeleton')
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data?.user_prompt_template) {
      return {
        id: data.id ?? null,
        updatedAt: data.updated_at ?? null,
        skeletonHtml: data.user_prompt_template,
      };
    }
  } catch {
    // Fall back to the seed-backed prompt loader below.
  }

  const prompt = await getPrompt('document-skeleton');
  return {
    id: null,
    updatedAt: null,
    skeletonHtml: prompt.userPromptTemplate,
  };
}

async function fetchSnapshotInputs(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<{
  alignment: AlignmentRow;
  analysis: AnalysisRow;
  participants: ParticipantRow[];
  responses: ResponseRow[];
  template: TemplateRow | null;
  prompt: DocumentPromptSource;
  profileNames: Map<string, string | null>;
}> {
  const { data: alignment, error: alignmentError } = await supabase
    .from('alignments')
    .select('*')
    .eq('id', alignmentId)
    .single();

  if (alignmentError || !alignment) {
    throw AlignmentError.notFound(alignmentId);
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('alignment_analyses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .single();

  if (analysisError || !analysis || !analysis.summary) {
    throw new AlignmentError('Latest analysis is required before signing', 'DOCUMENT_ANALYSIS_MISSING', 409, {
      alignmentId,
      round,
    });
  }

  const summary = analysis.summary as unknown as AnalysisSummary;
  const conflicts = Array.isArray(summary.conflicts) ? summary.conflicts : [];
  if (conflicts.length > 0) {
    throw new AlignmentError('Resolve all conflicts before signing the agreement', 'DOCUMENT_CONFLICTS_REMAIN', 409, {
      alignmentId,
      round,
      conflictCount: conflicts.length,
      resolutionUrl: `/alignment/${alignmentId}/resolution`,
    });
  }

  const { data: participants, error: participantsError } = await supabase
    .from('alignment_participants')
    .select('*')
    .eq('alignment_id', alignmentId);

  if (participantsError || !participants || participants.length === 0) {
    throw new AlignmentError('Alignment participants are required before signing', 'DOCUMENT_PARTICIPANTS_MISSING', 409, {
      alignmentId,
      round,
    });
  }

  const { data: responses, error: responsesError } = await supabase
    .from('alignment_responses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .not('submitted_at', 'is', null);

  if (responsesError || !responses) {
    throw new AlignmentError('Submitted responses are required before signing', 'DOCUMENT_RESPONSES_MISSING', 409, {
      alignmentId,
      round,
    });
  }

  const userIds = participants.map((participant) => participant.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileNames = new Map<string, string | null>(
    (profiles || []).map((profile) => [profile.id, profile.display_name])
  );

  let template: TemplateRow | null = null;
  if (alignment.template_id) {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('id', alignment.template_id)
      .maybeSingle();
    template = data ?? null;
  }

  const prompt = await loadDocumentPromptSource(supabase);

  return {
    alignment,
    analysis,
    participants,
    responses,
    template,
    prompt,
    profileNames,
  };
}

function participantDisplayName(
  participant: ParticipantRow,
  profileNames: Map<string, string | null>
): string {
  const displayName = profileNames.get(participant.user_id);
  if (displayName && displayName.trim().length > 0) {
    return displayName;
  }
  return participant.role === 'owner' ? 'Owner' : 'Partner';
}

function mapSnapshotRow(row: SnapshotRow): AgreementSnapshotView {
  const snapshot = row.snapshot as unknown as CanonicalSnapshot;
  return {
    id: row.id,
    hash: row.snapshot_hash,
    snapshot,
    documentHtml: row.document_html,
    documentSections: row.document_sections as unknown as DocumentSection[],
    documentInputs: row.document_inputs as unknown as CanonicalSnapshot['document']['inputs'],
    isFrozen: true,
  };
}

function documentReviewRequired(
  alignmentId: string,
  reviewedSnapshotHash: string,
  currentSnapshotHash: string
): AlignmentError {
  return new AlignmentError(
    'This agreement was updated after you opened the page. Refresh and review the current document before signing.',
    'DOCUMENT_REVIEW_REQUIRED',
    409,
    {
      reviewedSnapshotHash,
      currentSnapshotHash,
      refreshUrl: `/alignment/${alignmentId}/document`,
    }
  );
}

function isUniqueViolation(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { code?: string }).code === '23505';
}

export function legacySignatureRequiresReview(
  alignmentId: string,
  round: number
): AlignmentError {
  return new AlignmentError(
    'This round has an older signature that cannot be verified against the current agreement document. Both parties need to re-review the agreement before signing again.',
    'DOCUMENT_REVIEW_REQUIRED',
    409,
    {
      alignmentId,
      round,
      refreshUrl: `/alignment/${alignmentId}/document`,
    }
  );
}

export async function buildAgreementSnapshotPreview(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<AgreementSnapshotView> {
  const {
    alignment,
    analysis,
    participants,
    responses,
    template,
    prompt,
    profileNames,
  } = await fetchSnapshotInputs(supabase, alignmentId, round);

  const orderedParticipants = [...participants].sort((a, b) => {
    const roleDiff = roleOrder(a.role) - roleOrder(b.role);
    if (roleDiff !== 0) return roleDiff;
    const createdDiff = a.created_at.localeCompare(b.created_at);
    if (createdDiff !== 0) return createdDiff;
    return a.user_id.localeCompare(b.user_id);
  });

  const responseUserIds = new Set(responses.map((response) => response.user_id));
  const missingResponse = orderedParticipants.find((participant) => !responseUserIds.has(participant.user_id));
  if (missingResponse) {
    throw new AlignmentError('All participants must submit responses before signing', 'DOCUMENT_RESPONSES_MISSING', 409, {
      alignmentId,
      round,
      userId: missingResponse.user_id,
    });
  }

  const summary = analysis.summary as unknown as AnalysisSummary;
  const finalPositions = getFinalPositions(summary);
  const summaryPoints = getSummaryPoints(summary);
  const documentDate = formatDocumentDate(analysis.created_at);
  const templateName = template?.name ?? 'Alignment Agreement';
  const templateCategory = getTemplateCategory(template);
  const participantNames = orderedParticipants.map((participant) =>
    participantDisplayName(participant, profileNames)
  );
  const { documentHtml, sections } = renderAgreementDocument({
    participantNames,
    documentDate,
    templateName,
    templateCategory,
    finalPositions,
    summary: summaryPoints,
    skeletonHtml: prompt.skeletonHtml,
  });
  const documentInputs: CanonicalSnapshot['document']['inputs'] = {
    participant_names: participantNames,
    document_date: documentDate,
    template_name: templateName,
    template_category: templateCategory,
    final_positions: finalPositions,
    summary: summaryPoints,
  };
  const hashInput: CanonicalSnapshotHashInput = {
    snapshot_version: 1,
    alignment_id: alignmentId,
    round,
    source: {
      alignment_updated_at: alignment.updated_at,
      analysis_id: analysis.id,
      analysis_created_at: analysis.created_at,
      template_id: alignment.template_id,
      template_version: template?.version ?? null,
      template_content_hash: template ? sha256(stableStringify(template.content)) : null,
      document_prompt: {
        slug: 'document-skeleton',
        prompt_id: prompt.id,
        updated_at: prompt.updatedAt,
        template_hash: sha256(prompt.skeletonHtml),
      },
    },
    participants: orderedParticipants.map((participant, index) => ({
      user_id: participant.user_id,
      role: assertParticipantRole(participant.role),
      display_name: profileNames.get(participant.user_id) ?? null,
      order: index + 1,
    })),
    responses: [...responses]
      .sort((a, b) => a.user_id.localeCompare(b.user_id))
      .map((response) => {
        if (!response.submitted_at) {
          throw new AlignmentError('Submitted responses are required before signing', 'DOCUMENT_RESPONSES_MISSING', 409, {
            alignmentId,
            round,
            userId: response.user_id,
          });
        }

        return {
          user_id: response.user_id,
          response_id: response.id,
          response_version: response.response_version,
          submitted_at: response.submitted_at,
          answers: response.answers as unknown as ResponseAnswers,
        };
      }),
    analysis: summary,
    document: {
      html: documentHtml,
      sections,
      inputs: documentInputs,
    },
  };
  const hash = sha256(stableStringify(hashInput));
  const snapshot: CanonicalSnapshot = {
    ...hashInput,
    hash,
    frozen_at: '',
  };

  return {
    id: null,
    hash,
    snapshot,
    documentHtml,
    documentSections: sections,
    documentInputs,
    isFrozen: false,
  };
}

export async function loadFrozenAgreementSnapshot(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<AgreementSnapshotView | null> {
  const { data, error } = await supabase
    .from('alignment_agreement_snapshots')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    throw new AlignmentError('Failed to load agreement snapshot', 'AGREEMENT_SNAPSHOT_LOAD_FAILED', 500, {
      alignmentId,
      round,
      cause: error.message,
    });
  }

  return data ? mapSnapshotRow(data) : null;
}

export async function getOrCreateFrozenAgreementSnapshot(params: {
  supabase: SupabaseClientType;
  alignmentId: string;
  round: number;
  userId: string;
  reviewedSnapshotHash: string;
}): Promise<AgreementSnapshotView> {
  const { supabase, alignmentId, round, userId, reviewedSnapshotHash } = params;
  const existing = await loadFrozenAgreementSnapshot(supabase, alignmentId, round);

  if (existing) {
    if (existing.hash !== reviewedSnapshotHash) {
      throw documentReviewRequired(alignmentId, reviewedSnapshotHash, existing.hash);
    }
    return existing;
  }

  const preview = await buildAgreementSnapshotPreview(supabase, alignmentId, round);
  if (preview.hash !== reviewedSnapshotHash) {
    throw documentReviewRequired(alignmentId, reviewedSnapshotHash, preview.hash);
  }

  const frozenAt = new Date().toISOString();
  const frozenSnapshot: CanonicalSnapshot = {
    ...preview.snapshot,
    frozen_at: frozenAt,
  };

  const { data, error } = await supabase
    .from('alignment_agreement_snapshots')
    .insert({
      alignment_id: alignmentId,
      round,
      snapshot_hash: preview.hash,
      snapshot: frozenSnapshot as unknown as Json,
      document_html: preview.documentHtml,
      document_sections: preview.documentSections as unknown as Json,
      document_inputs: preview.documentInputs as unknown as Json,
      created_by: userId,
      frozen_at: frozenAt,
    })
    .select()
    .single();

  if (!error && data) {
    return mapSnapshotRow(data);
  }

  if (!isUniqueViolation(error)) {
    throw new AlignmentError('Failed to freeze agreement snapshot', 'AGREEMENT_SNAPSHOT_CREATE_FAILED', 500, {
      alignmentId,
      round,
      cause: error?.message,
    });
  }

  const winner = await loadFrozenAgreementSnapshot(supabase, alignmentId, round);
  if (!winner) {
    throw new AlignmentError('Failed to load the frozen agreement snapshot', 'AGREEMENT_SNAPSHOT_LOAD_FAILED', 500, {
      alignmentId,
      round,
    });
  }
  if (winner.hash !== reviewedSnapshotHash) {
    throw documentReviewRequired(alignmentId, reviewedSnapshotHash, winner.hash);
  }

  return winner;
}
