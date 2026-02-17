/**
 * Final Agreement Document Page
 * Displays AI-generated agreement document with signature collection
 *
 * Reference: plan_a.md lines 961-1008, 1024-1045
 * Design: page_design_templates/{dark_mode,light_mode}/final_document_page_for_align_the_humans/
 */

import { notFound, redirect } from 'next/navigation';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';
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

async function getDocumentData(alignmentId: string, userId: string) {
  const supabase = createServerClient();

  // Get alignment details with template_id
  const { data: alignment, error } = await getAlignmentDetail(
    supabase,
    alignmentId,
    userId
  );

  if (error || !alignment) {
    return null;
  }

  const templateId = (alignment as any)?.template_id ?? null;

  // Get participant profiles
  const participantIds = alignment.participants.map(p => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', participantIds);

  // Get latest analysis for summary
  const { data: analysis } = await supabase
    .from('alignment_analyses')
    .select('summary, details')
    .eq('alignment_id', alignmentId)
    .eq('round', alignment.current_round)
    .single();

  // Get signatures
  const { data: signatures } = await supabase
    .from('alignment_signatures')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', alignment.current_round);

  return {
    alignment,
    templateId,
    profiles: profiles || [],
    analysis,
    signatures: signatures || [],
  };
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();
  const user = await requireAuth(supabase);

  const data = await getDocumentData(id, user.id);

  if (!data) {
    notFound();
  }

  const { alignment, templateId, profiles, analysis, signatures } = data;

  // Redirect to appropriate phase if not ready for document
  if (alignment.status !== 'resolving' && alignment.status !== 'complete') {
    switch (alignment.status) {
      case 'draft':
        redirect(`/alignment/${id}/clarity`);
        break;
      case 'active':
        redirect(`/alignment/${id}/waiting`);
        break;
      case 'analyzing':
        redirect(`/alignment/${id}/analysis`);
        break;
      default:
        redirect('/dashboard');
    }
  }

  // Find current user and partner
  const currentParticipant = alignment.participants.find(p => p.user_id === user.id);
  const partnerParticipant = alignment.participants.find(p => p.user_id !== user.id);

  if (!currentParticipant || !partnerParticipant) {
    notFound();
  }

  const currentProfile = profiles.find(p => p.id === user.id);
  const partnerProfile = profiles.find(p => p.id === partnerParticipant.user_id);

  const currentUserName = currentProfile?.display_name || 'You';
  const partnerName = partnerProfile?.display_name || 'Partner';

  // Check signature status
  const currentUserSignature = signatures.find(s => s.user_id === user.id);
  const partnerSignature = signatures.find(s => s.user_id === partnerParticipant.user_id);

  const hasUserSigned = !!currentUserSignature;
  const hasPartnerSigned = !!partnerSignature;
  const allSigned = hasUserSigned && hasPartnerSigned;

  // Extract key terms from analysis summary
  const summaryData = analysis?.summary as any;
  const keyTerms = summaryData?.agreements?.slice(0, 5).map((a: any) => a.description) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Success Header */}
        <DocumentHeader
          title={alignment.title || 'Alignment Agreement'}
          isComplete={allSigned}
        />

        {/* Executive Summary Card */}
        <ExecutiveSummary
          alignmentTitle={alignment.title || 'Alignment Agreement'}
          dateFinalized={alignment.updated_at}
          participants={[currentUserName, partnerName]}
          keyTerms={keyTerms}
        />

        {/* Official Agreement Document */}
        <DocumentContent
          alignmentId={alignment.id}
          templateId={templateId}
          alignmentTitle={alignment.title || 'Alignment Agreement'}
          participants={[currentUserName, partnerName]}
          dateFinalized={alignment.updated_at}
          analysis={analysis}
        />

        {/* Digital Signatures */}
        <SignatureSection
          alignmentId={alignment.id}
          round={alignment.current_round}
          currentUserId={user.id}
          currentUserName={currentUserName}
          partnerUserId={partnerParticipant.user_id}
          partnerName={partnerName}
          currentUserSignature={currentUserSignature}
          partnerSignature={partnerSignature}
          allSigned={allSigned}
        />

        {/* Document Actions */}
        {allSigned && (
          <DocumentActions
            alignmentId={alignment.id}
            alignmentTitle={alignment.title || 'Alignment Agreement'}
          />
        )}

      </div>
    </div>
  );
}
