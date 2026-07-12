/**
 * Final Agreement Document Page
 * Displays the server-owned agreement document with signature collection.
 *
 * Reference: plan_a.md lines 961-1008, 1024-1045
 * Design: page_design_templates/{dark_mode,light_mode}/final_document_page_for_align_the_humans/
 */

import { notFound, redirect } from 'next/navigation';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { assertReadyForDocument } from '@/app/lib/db-helpers';
import {
  buildAgreementSnapshotPreview,
  loadFrozenAgreementSnapshot,
} from '@/app/lib/agreement-snapshots';
import { AlignmentError } from '@/app/lib/errors';
import { DocumentHeader } from './components/document-header';
import { ExecutiveSummary } from './components/executive-summary';
import { DocumentContent } from './components/document-content';
import { SignatureSection } from './components/signature-section';
import { DocumentActions } from './components/document-actions';

// ============================================================================
// Data Fetching
// ============================================================================

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

type ParticipantRole = 'owner' | 'partner';

interface SignatureParticipantView {
  userId: string;
  displayName: string;
  role: ParticipantRole;
  signature: {
    id: string;
    created_at: string;
    agreement_snapshot_hash: string | null;
  } | null;
}

function roleOrder(role: string): number {
  return role === 'owner' ? 0 : 1;
}

function asParticipantRole(role: string): ParticipantRole {
  return role === 'owner' ? 'owner' : 'partner';
}

function fallbackName(role: string): string {
  return role === 'owner' ? 'Owner' : 'Partner';
}

function redirectForDocumentError(error: AlignmentError, alignmentId: string): never {
  switch (error.code) {
    case 'DOCUMENT_CONFLICTS_REMAIN':
      redirect(`/alignment/${alignmentId}/resolution`);
    case 'DOCUMENT_ANALYSIS_MISSING':
      redirect(`/alignment/${alignmentId}/analysis`);
    case 'DOCUMENT_NOT_READY': {
      const status = error.details?.status;
      switch (status) {
        case 'draft':
          redirect(`/alignment/${alignmentId}/clarity`);
        case 'active':
          redirect(`/alignment/${alignmentId}/waiting`);
        case 'analyzing':
          redirect(`/alignment/${alignmentId}/analysis`);
        default:
          redirect('/dashboard');
      }
    }
    case 'ALIGNMENT_NOT_FOUND':
    case 'ALIGNMENT_UNAUTHORIZED':
      notFound();
    default:
      throw error;
  }
}

async function getDocumentData(alignmentId: string, userId: string) {
  const supabase = createServerClient();
  const readiness = await assertReadyForDocument(supabase, alignmentId, userId);
  const { alignment, analysis, round } = readiness;

  const { data: participants, error: participantsError } = await supabase
    .from('alignment_participants')
    .select('*')
    .eq('alignment_id', alignmentId);

  if (participantsError || !participants || participants.length === 0) {
    return null;
  }

  const orderedParticipants = [...participants].sort((a, b) => {
    const roleDiff = roleOrder(a.role) - roleOrder(b.role);
    if (roleDiff !== 0) return roleDiff;
    const createdDiff = a.created_at.localeCompare(b.created_at);
    if (createdDiff !== 0) return createdDiff;
    return a.user_id.localeCompare(b.user_id);
  });

  const participantIds = orderedParticipants.map((participant) => participant.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', participantIds);
  const profileNames = new Map((profiles || []).map((profile) => [profile.id, profile.display_name]));

  const frozenSnapshot = await loadFrozenAgreementSnapshot(
    supabase,
    alignment.id,
    round
  );
  const agreementSnapshot = frozenSnapshot ?? await buildAgreementSnapshotPreview(
    supabase,
    alignment.id,
    round
  );

  const { data: signatures } = await supabase
    .from('alignment_signatures')
    .select('id, user_id, created_at, agreement_snapshot_hash')
    .eq('alignment_id', alignmentId)
    .eq('round', round);
  const signaturesByUserId = new Map(
    (signatures || [])
      .filter((signature) => signature.agreement_snapshot_hash === agreementSnapshot.hash)
      .map((signature) => [signature.user_id, signature])
  );

  const signatureParticipants: SignatureParticipantView[] = orderedParticipants.map((participant) => ({
    userId: participant.user_id,
    displayName: profileNames.get(participant.user_id) || fallbackName(participant.role),
    role: asParticipantRole(participant.role),
    signature: signaturesByUserId.get(participant.user_id) || null,
  }));
  const allSigned = signatureParticipants.length > 0 &&
    signatureParticipants.every((participant) => !!participant.signature);

  return {
    alignment,
    analysis,
    agreementSnapshot,
    signatureParticipants,
    allSigned,
  };
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();
  const user = await requireAuth(supabase);
  let data: Awaited<ReturnType<typeof getDocumentData>> | null;

  try {
    data = await getDocumentData(id, user.id);
  } catch (error) {
    if (error instanceof AlignmentError) {
      redirectForDocumentError(error, id);
    }
    throw error;
  }

  if (!data) {
    notFound();
  }

  const { alignment, analysis, agreementSnapshot, signatureParticipants, allSigned } = data;
  const participantNames = signatureParticipants.map((participant) => participant.displayName);
  const keyTerms = agreementSnapshot.documentInputs.summary;
  // Use the exact date string frozen into the document body so the summary can
  // never disagree with the agreement text (frozen_at can cross UTC midnight
  // relative to the analysis-derived body date).
  const dateFinalized = agreementSnapshot.documentInputs.document_date;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">

        <DocumentHeader
          title={alignment.title || 'Alignment Agreement'}
          isComplete={allSigned}
        />

        <ExecutiveSummary
          alignmentTitle={alignment.title || 'Alignment Agreement'}
          dateFinalized={dateFinalized}
          participants={participantNames}
          keyTerms={keyTerms}
        />

        <div id="alignment-document-export" className="space-y-8">
          <DocumentContent
            documentHtml={agreementSnapshot.documentHtml}
            snapshotHash={agreementSnapshot.hash}
            isFrozen={agreementSnapshot.isFrozen}
          />

          <SignatureSection
            alignmentId={alignment.id}
            round={alignment.current_round}
            reviewedSnapshotHash={agreementSnapshot.hash}
            currentUserId={user.id}
            participants={signatureParticipants}
            allSigned={allSigned}
          />
        </div>

        {allSigned && (
          <DocumentActions
            alignmentId={alignment.id}
            alignmentTitle={alignment.title || 'Alignment Agreement'}
            exportElementId="alignment-document-export"
          />
        )}

      </div>
    </div>
  );
}
