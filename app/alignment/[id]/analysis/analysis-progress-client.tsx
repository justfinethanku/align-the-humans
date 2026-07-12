'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AnalysisProgressClientProps {
  alignmentId: string;
  round: number;
  alignmentTitle: string;
}

type ProgressState = 'starting' | 'in_progress' | 'complete' | 'error';

interface AnalyzeResponseBody {
  data?: {
    status?: string;
    retryAfterSeconds?: number;
    message?: string;
    analysis?: unknown;
  };
  error?: {
    message?: string;
  };
}

export function AnalysisProgressClient({
  alignmentId,
  round,
  alignmentTitle,
}: AnalysisProgressClientProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTriggeredRef = useRef(false);
  const [state, setState] = useState<ProgressState>('starting');
  const [message, setMessage] = useState('Starting analysis...');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const scheduleNextPoll = (seconds: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(runAnalysisPoll, Math.max(1, seconds) * 1000);
    };

    async function runAnalysisPoll() {
      if (cancelled) return;

      try {
        const response = await fetch('/api/alignment/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ alignmentId, round }),
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null) as AnalyzeResponseBody | null;

        if (cancelled) return;

        if (response.ok && body?.data?.analysis) {
          setState('complete');
          setMessage('Analysis complete.');

          if (!refreshTriggeredRef.current) {
            refreshTriggeredRef.current = true;
            // The server page can race the just-saved analysis and keep
            // rendering this card; keep nudging until the report swaps in
            // (this component unmounts when it does).
            router.refresh();
            let attempts = 0;
            refreshIntervalRef.current = setInterval(() => {
              attempts += 1;
              if (cancelled || attempts > 5) {
                if (refreshIntervalRef.current) {
                  clearInterval(refreshIntervalRef.current);
                }
                return;
              }
              router.refresh();
            }, 2000);
          }
          return;
        }

        if (response.status === 202) {
          const retryAfterHeader = Number(response.headers.get('Retry-After'));
          const retryAfterSeconds =
            body?.data?.retryAfterSeconds || retryAfterHeader || 3;

          setState('in_progress');
          setMessage(body?.data?.message || 'Analysis is already in progress.');
          scheduleNextPoll(retryAfterSeconds);
          return;
        }

        throw new Error(body?.error?.message || 'Analysis request failed.');
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) {
          return;
        }

        setState('error');
        setMessage(error instanceof Error ? error.message : 'Analysis request failed.');
      }
    }

    runAnalysisPoll();

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [alignmentId, round, router, retryNonce]);

  const handleRetry = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    refreshTriggeredRef.current = false;
    setState('starting');
    setMessage('Starting analysis...');
    setRetryNonce(value => value + 1);
  };

  const isError = state === 'error';
  const isComplete = state === 'complete';

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <div className="size-5 rounded-full bg-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Align the Humans
            </h2>
          </Link>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-base font-semibold text-primary">
              Analysis Report
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              {alignmentTitle}
            </h1>
          </div>

          <Card className="flex flex-col items-center gap-5 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div
              className={`flex size-14 items-center justify-center rounded-full ${
                isError
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : isComplete
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-primary/10 text-primary'
              }`}
            >
              {isError ? (
                <AlertTriangle className="size-7" />
              ) : isComplete ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <Brain className="size-7" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {isError
                  ? 'Analysis needs another try'
                  : isComplete
                    ? 'Analysis complete'
                    : 'Analyzing responses'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>

            {!isError && !isComplete && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="size-4 animate-spin" />
                <span>Preparing your report</span>
              </div>
            )}

            {isError && (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            )}

            {isComplete && (
              <Button onClick={() => window.location.reload()}>
                View Report
              </Button>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
