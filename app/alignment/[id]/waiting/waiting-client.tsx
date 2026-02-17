'use client';

/**
 * Waiting Page Client Component
 * Handles realtime subscription for partner submission status
 * and auto-redirects when both parties have submitted.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAlignmentUpdates } from '@/app/lib/hooks/useAlignmentUpdates';
import { createClient } from '@/app/lib/supabase-browser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Loader2, Wifi, WifiOff } from 'lucide-react';

interface WaitingClientProps {
  alignmentId: string;
  alignmentTitle: string;
  partnerName: string;
  initialPartnerSubmitted: boolean;
  hasPartnerJoined: boolean;
}

export function WaitingClient({
  alignmentId,
  alignmentTitle,
  partnerName,
  initialPartnerSubmitted,
  hasPartnerJoined,
}: WaitingClientProps) {
  const router = useRouter();
  const [partnerSubmitted, setPartnerSubmitted] = useState(initialPartnerSubmitted);
  const [partnerJoined, setPartnerJoined] = useState(hasPartnerJoined);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // If partner already submitted on load, redirect immediately
  useEffect(() => {
    if (initialPartnerSubmitted) {
      router.push(`/alignment/${alignmentId}/analysis`);
    }
  }, [initialPartnerSubmitted, alignmentId, router]);

  // Realtime subscription for alignment status changes
  const handleUpdate = useCallback(
    (alignment: any) => {
      if (alignment.status === 'analyzing' || alignment.status === 'resolving') {
        router.push(`/alignment/${alignmentId}/analysis`);
      }
    },
    [alignmentId, router]
  );

  const handlePartnerJoin = useCallback(() => {
    setPartnerJoined(true);
  }, []);

  const { connected, error: realtimeError } = useAlignmentUpdates({
    alignmentId,
    onUpdate: handleUpdate,
    onPartnerJoin: handlePartnerJoin,
  });

  // Polling fallback: check every 10s if partner has submitted
  useEffect(() => {
    if (partnerSubmitted) return;

    const supabase = createClient();

    const poll = async () => {
      const { data: responses } = await supabase
        .from('alignment_responses')
        .select('id, submitted_at')
        .eq('alignment_id', alignmentId)
        .not('submitted_at', 'is', null);

      if (responses && responses.length >= 2) {
        setPartnerSubmitted(true);
        router.push(`/alignment/${alignmentId}/analysis`);
      }

      // Also check alignment status directly
      const { data: alignment } = await supabase
        .from('alignments')
        .select('status')
        .eq('id', alignmentId)
        .single();

      if (
        alignment?.status === 'analyzing' ||
        alignment?.status === 'resolving' ||
        alignment?.status === 'complete'
      ) {
        router.push(`/alignment/${alignmentId}/analysis`);
      }
    };

    pollRef.current = setInterval(poll, 10000);
    // Initial poll after 3s
    const initialPoll = setTimeout(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(initialPoll);
    };
  }, [alignmentId, partnerSubmitted, router]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex w-full max-w-3xl items-center justify-between px-4 sm:px-6">
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
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              Waiting for {partnerName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {alignmentTitle}
            </p>
          </div>

          {/* Status Cards */}
          <div className="space-y-4">
            {/* Your submission - always complete */}
            <Card className="flex items-center gap-4 border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
              <CheckCircle2 className="size-6 flex-shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Your responses submitted
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your answers have been recorded
                </p>
              </div>
            </Card>

            {/* Partner status */}
            <Card
              className={`flex items-center gap-4 p-4 ${
                partnerSubmitted
                  ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30'
                  : !partnerJoined
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50'
              }`}
            >
              {partnerSubmitted ? (
                <CheckCircle2 className="size-6 flex-shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="size-6 flex-shrink-0 text-slate-400 dark:text-slate-500 animate-pulse" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    partnerSubmitted
                      ? 'text-green-800 dark:text-green-200'
                      : !partnerJoined
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {partnerSubmitted
                    ? `${partnerName} has submitted`
                    : !partnerJoined
                      ? `${partnerName} hasn't joined yet`
                      : `Waiting for ${partnerName}`}
                </p>
                <p
                  className={`text-sm ${
                    partnerSubmitted
                      ? 'text-green-600 dark:text-green-400'
                      : !partnerJoined
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {partnerSubmitted
                    ? 'Ready for AI analysis'
                    : !partnerJoined
                      ? 'Share the invite link with your partner'
                      : 'They are working on their responses'}
                </p>
              </div>
              {!partnerSubmitted && (
                <Loader2 className="size-5 animate-spin text-slate-400" />
              )}
            </Card>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            {connected ? (
              <>
                <Wifi className="size-3" />
                <span>Live updates active</span>
              </>
            ) : realtimeError ? (
              <>
                <WifiOff className="size-3 text-amber-500" />
                <span className="text-amber-500">
                  Live updates unavailable - polling every 10s
                </span>
              </>
            ) : (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Connecting...</span>
              </>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Once both partners submit their responses, AI will analyze them
              to identify areas of alignment and potential conflicts. This page
              will automatically redirect when the analysis begins.
            </p>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
