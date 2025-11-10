'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Alignment Detail Error State
 *
 * Displayed when an error occurs in any alignment phase
 * (clarity, questions, analysis, resolution, document)
 * Provides option to retry or return to dashboard
 */
export default function AlignmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Alignment error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Alignment Error
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We encountered an error loading this alignment. Please try again.
          </p>
          {error.message && (
            <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
