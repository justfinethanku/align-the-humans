/**
 * Alignment Clarity Page (Server Component)
 *
 * AI-assisted form to clarify alignment goals before generating questions.
 * Based on plan_a.md lines 724-750
 *
 * Design reference: page_design_templates/{dark_mode,light_mode}/define_alignment_clarity_page
 */

import { redirect } from 'next/navigation';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';
import { ClarityForm } from './ClarityForm';

interface ClarityPageProps {
  params: { id: string };
  searchParams?: {
    template?: string;
    partnerId?: string;
    partnerName?: string;
  };
}

export default async function ClarityPage({ params, searchParams }: ClarityPageProps) {
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Fetch alignment with full details
    const { data: alignment, error } = await getAlignmentDetail(
      supabase,
      params.id,
      user.id
    );

    if (error || !alignment) {
      console.error('Failed to fetch alignment:', error);
      redirect('/dashboard');
    }

    // 3. Check if user is a participant
    const isParticipant = alignment.participants.some(
      (p) => p.user_id === user.id
    );

    if (!isParticipant) {
      console.error('User is not a participant in this alignment');
      redirect('/dashboard');
    }

    // 4. Check alignment status (should be 'draft' for clarity phase)
    if (alignment.status !== 'draft') {
      switch (alignment.status) {
        case 'active':
          redirect(`/alignment/${params.id}/questions`);
        case 'analyzing':
          redirect(`/alignment/${params.id}/analysis`);
        case 'resolving':
          redirect(`/alignment/${params.id}/resolution`);
        case 'complete':
          redirect(`/alignment/${params.id}/document`);
        default:
          redirect(`/alignment/${params.id}`);
      }
    }

    const templateSeed =
      typeof searchParams?.template === 'string' && searchParams.template.length > 0
        ? searchParams.template
        : 'custom';

    // Extract preselected partner from URL params
    const preselectedPartner = searchParams?.partnerId && searchParams?.partnerName
      ? {
          id: searchParams.partnerId,
          name: decodeURIComponent(searchParams.partnerName),
        }
      : null;

    const clarityDraft = (alignment.clarity_draft as any) || {};

    // 5. Fetch user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // 6. Render client component with data
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ClarityForm
          alignmentId={params.id}
          userId={user.id}
          userDisplayName={profile?.display_name || 'User'}
          initialTitle={alignment.title || ''}
          status={alignment.status}
          templateSeed={templateSeed}
          initialClarity={{
            topic: (clarityDraft.topic as string) || alignment.title || '',
            partner: (clarityDraft.partner as string) || preselectedPartner?.name || '',
            desiredOutcome: (clarityDraft.desiredOutcome as string) || '',
          }}
          preselectedPartner={preselectedPartner}
        />
      </div>
    );
  } catch (error) {
    console.error('Clarity page error:', error);
    redirect('/dashboard');
  }
}
