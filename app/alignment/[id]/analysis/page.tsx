/**
 * AI Analysis Results Page
 *
 * Displays comprehensive analysis of both participants' responses:
 * - Aligned items (build momentum)
 * - Conflicts requiring resolution (categorized by severity)
 * - Hidden assumptions
 * - Gaps in discussion
 * - Power imbalances
 *
 * Design Reference: page_design_templates/{dark_mode,light_mode}/cofounder_agreement_report
 * Specification: plan_a.md lines 836-920
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { getAlignmentDetail } from '@/app/lib/db-helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { dateUtils } from '@/app/lib/utils';
import type { ConflictSeverity } from '@/app/lib/types';
import {
  CheckCircle2,
  AlertTriangle,
  Brain,
  HelpCircle,
  Scale,
  ChevronDown,
} from 'lucide-react';

interface PageProps {
  params: { id: string };
}

/**
 * Severity badge color mapping
 */
const severityColors: Record<ConflictSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  minor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
};

/**
 * Section header component with icon
 */
function SectionHeader({
  icon: Icon,
  title,
  count,
  color,
}: {
  icon: any;
  title: string;
  count?: number;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-4 border-b ${color} pb-3`}>
      <div
        className={`flex size-10 items-center justify-center rounded-full ${color.replace('border-', 'bg-').replace('/50', '/10').replace('/30', '/10')} ${color.replace('border-', 'text-').replace('dark:', '').replace('/50', '').replace('/30', '')}`}
      >
        <Icon className="size-5" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {title}
        {count !== undefined && ` (${count})`}
      </h2>
    </div>
  );
}

/**
 * Conflict item component with collapsible details
 */
function ConflictItem({
  conflict,
  index,
}: {
  conflict: any;
  index: number;
}) {
  const severity = conflict.severity as ConflictSeverity;
  const severityColor = severityColors[severity] || severityColors.moderate;

  return (
    <details className="group rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Badge
            className={`${severityColor} border`}
          >
            {severity}
          </Badge>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {conflict.topic}
          </h3>
        </div>
        <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400">
          {conflict.description}
        </p>

        {/* Positions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-300">
              Position A:
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {conflict.personA_position}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-300">
              Position B:
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {conflict.personB_position}
            </p>
          </div>
        </div>

        {/* AI Suggestions */}
        {conflict.suggestions && conflict.suggestions.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              AI Suggested Compromises:
            </p>
            <ul className="mt-2 space-y-2">
              {conflict.suggestions.map((suggestion: string, i: number) => (
                <li
                  key={i}
                  className="text-amber-700 dark:text-amber-400"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export default async function AnalysisPage({ params }: PageProps) {
  const supabase = createServerClient();
  const user = await getCurrentUser(supabase);

  // Require authentication
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch alignment with analysis
  const { data: alignment, error } = await getAlignmentDetail(
    supabase,
    params.id,
    user.id
  );

  if (error || !alignment) {
    redirect('/dashboard');
  }

  let alignmentDetail = alignment;
  let analysis = alignmentDetail.latest_analysis;

  if (!analysis) {
    const { data: responses } = await supabase
      .from('alignment_responses')
      .select('id')
      .eq('alignment_id', params.id)
      .eq('round', alignmentDetail.current_round)
      .not('submitted_at', 'is', null);

    if (!responses || responses.length < 2) {
      redirect(`/alignment/${params.id}/questions`);
    }

    await triggerServerAnalysis(params.id, alignmentDetail.current_round);

    const { data: refreshedAlignment } = await getAlignmentDetail(
      supabase,
      params.id,
      user.id
    );

    if (!refreshedAlignment || !refreshedAlignment.latest_analysis) {
      throw new Error('Analysis could not be generated. Please try again.');
    }

    alignmentDetail = refreshedAlignment;
    analysis = refreshedAlignment.latest_analysis;
  }

  // Parse analysis data
  const analysisData = analysis.details as any;
  const alignedItems = analysisData?.alignedItems || [];
  const conflicts = analysisData?.conflicts || [];
  const hiddenAssumptions = analysisData?.hiddenAssumptions || [];
  const gaps = analysisData?.gaps || [];
  const imbalances = analysisData?.imbalances || [];
  const alignmentScore = analysis.summary?.alignment_score || 0;

  // Determine action button
  const hasConflicts = conflicts.length > 0;
  const nextRoute = hasConflicts
    ? `/alignment/${params.id}/resolution`
    : `/alignment/${params.id}/document`;
  const buttonText = hasConflicts
    ? 'Resolve Conflicts'
    : 'Generate Final Document';

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <div className="size-5 rounded-full bg-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Align The Humans
            </h2>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col items-center">
        <div className="flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-primary">
              Analysis Report
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              {alignmentDetail.title || 'Alignment Analysis'}
            </h1>
            <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">
              This report summarizes your individual responses, highlighting
              areas of alignment and conflicts to be resolved for a successful
              partnership.
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>
                Analysis completed {dateUtils.formatRelative(analysis.created_at)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>Alignment Score: {alignmentScore}/100</span>
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="flex w-full flex-col gap-8">
            {/* Aligned Items Section */}
            {alignedItems.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  icon={CheckCircle2}
                  title="Aligned Items"
                  count={alignedItems.length}
                  color="border-green-200 dark:border-green-800/50"
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {alignedItems.map((item: any, index: number) => (
                    <Card
                      key={index}
                      className="flex items-start gap-3 border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <CheckCircle2 className="mt-1 size-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.description}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.shared_value}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Conflicts Section */}
            {conflicts.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  icon={AlertTriangle}
                  title="Conflicts Requiring Resolution"
                  count={conflicts.length}
                  color="border-orange-200 dark:border-orange-800/50"
                />
                <div className="flex flex-col gap-4">
                  {conflicts
                    .sort((a: any, b: any) => {
                      const order: Record<ConflictSeverity, number> = { critical: 0, moderate: 1, minor: 2 };
                      const severityA = (a.severity as ConflictSeverity) || 'moderate';
                      const severityB = (b.severity as ConflictSeverity) || 'moderate';
                      return order[severityA] - order[severityB];
                    })
                    .map((conflict: any, index: number) => (
                      <ConflictItem
                        key={index}
                        conflict={conflict}
                        index={index}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Hidden Assumptions Section */}
            {hiddenAssumptions.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  icon={Brain}
                  title="Hidden Assumptions"
                  count={hiddenAssumptions.length}
                  color="border-purple-200 dark:border-purple-800/50"
                />
                <div className="flex flex-col gap-4">
                  {hiddenAssumptions.map((assumption: any, index: number) => (
                    <Card
                      key={index}
                      className="border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {assumption.assumption}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Affects: <span className="font-medium">{assumption.affected_party}</span>
                      </p>
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        {assumption.impact}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Gaps Section */}
            {gaps.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  icon={HelpCircle}
                  title="Gaps to Address"
                  count={gaps.length}
                  color="border-slate-300 dark:border-slate-700"
                />
                <div className="flex flex-col gap-4">
                  {gaps.map((gap: any, index: number) => {
                    const importance = gap.importance as ConflictSeverity;
                    const importanceColor = severityColors[importance] || severityColors.moderate;

                    return (
                    <Card
                      key={index}
                      className="border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {gap.topic}
                        </h3>
                        <Badge
                          className={`${importanceColor} border`}
                        >
                          {importance}
                        </Badge>
                      </div>
                      {gap.suggested_questions &&
                        gap.suggested_questions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Suggested questions to explore:
                            </p>
                            <ul className="mt-2 space-y-1">
                              {gap.suggested_questions.map(
                                (question: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-sm text-slate-600 dark:text-slate-400"
                                  >
                                    • {question}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </Card>
                  );
                  })}
                </div>
              </section>
            )}

            {/* Imbalances Section */}
            {imbalances.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  icon={Scale}
                  title="Imbalances Detected"
                  count={imbalances.length}
                  color="border-slate-300 dark:border-slate-700"
                />
                <div className="flex flex-col gap-4">
                  {imbalances.map((imbalance: any, index: number) => {
                    const severity = imbalance.severity as ConflictSeverity;
                    const severityColor = severityColors[severity] || severityColors.moderate;

                    return (
                    <Card
                      key={index}
                      className="border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {imbalance.type}
                        </h3>
                        <Badge
                          className={`${severityColor} border`}
                        >
                          {severity}
                        </Badge>
                      </div>
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        {imbalance.description}
                      </p>
                      {imbalance.mitigation && (
                        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Mitigation Strategy:
                          </p>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                            {imbalance.mitigation}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Action Card */}
          <Card className="mt-8 flex flex-col items-center justify-center gap-4 border-slate-200 bg-white p-8 shadow-md dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Ready for the Next Step?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {hasConflicts
                  ? 'Resolve the remaining conflicts to generate your final agreement.'
                  : 'All items aligned! Generate your final agreement document.'}
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={nextRoute}>{buttonText}</Link>
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}

async function triggerServerAnalysis(alignmentId: string, round: number) {
  const baseUrl = getBaseUrl();
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const response = await fetch(`${baseUrl}/api/alignment/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ alignmentId, round }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Analysis request failed: ${message}`);
  }
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}
