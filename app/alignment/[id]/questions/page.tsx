/**
 * Dynamic Questionnaire Page
 *
 * Renders AI-generated questions based on alignment template.
 * Supports 6 question types with inline AI assistance.
 * Auto-saves responses to alignment_responses table.
 *
 * Reference: plan_a.md lines 754-834
 * Design: page_design_templates/{dark_mode,light_mode}/alignment_questionnaire_financial_goal/
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';
import { AlignmentQuestion } from '@/app/lib/types';
import { QuestionnaireClient } from './questionnaire-client';
import { customTemplate } from '@/app/lib/templates';

/**
 * Server component: loads alignment data and questions
 */
export default async function QuestionsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const redirectParam = encodeURIComponent(`/alignment/${params.id}/questions`);
    redirect(`/login?redirectTo=${redirectParam}`);
  }

  // Load alignment with full details
  const { data: alignment, error: alignmentError } = await getAlignmentDetail(
    supabase,
    params.id,
    user.id
  );

  if (alignmentError || !alignment) {
    notFound();
  }

  // Load template/questions for this alignment
  let questions: AlignmentQuestion[] = [];

  if (alignment.template_id) {
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('content')
      .eq('id', alignment.template_id)
      .single();

    if (templateError) {
      console.error('Template load error:', templateError);
    } else {
      questions = ((template?.content as any)?.questions || []) as AlignmentQuestion[];
    }
  }

  if (!questions.length) {
    console.warn('Alignment missing template; falling back to curated custom template.');
    questions = customTemplate as AlignmentQuestion[];
  }

  // Get user's existing responses for this round
  const existingAnswers = alignment.user_response?.answers || {
    response_version: 1,
    answers: {},
  };

  // Get partner profile for display
  const partnerParticipant = alignment.participants.find(
    (p) => p.user_id !== user.id
  );
  let partnerName = 'your partner';

  if (partnerParticipant) {
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', partnerParticipant.user_id)
      .single();

    partnerName = partnerProfile?.display_name || 'your partner';
  }

  return (
    <Suspense fallback={<QuestionnaireSkeleton />}>
      <QuestionnaireClient
        alignmentId={params.id}
        questions={questions}
        existingAnswers={existingAnswers}
        alignmentTitle={alignment.title || 'Untitled Alignment'}
        partnerName={partnerName}
        currentRound={alignment.current_round}
        alignmentStatus={alignment.status}
      />
    </Suspense>
  );
}

/**
 * Loading skeleton for questionnaire
 */
function QuestionnaireSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-background/80 backdrop-blur-lg dark:border-slate-800">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1 flex-col items-center">
        <div className="w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="space-y-6">
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
