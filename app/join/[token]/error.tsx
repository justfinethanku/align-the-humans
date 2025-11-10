/**
 * Error Boundary for Join Page
 *
 * Catches and displays errors that occur during token validation or page rendering.
 * Provides user-friendly error message with option to retry or return home.
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JoinError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Join page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
              Something Went Wrong
            </h1>

            {/* Error Message */}
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {error.message || 'An unexpected error occurred while loading this invitation.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-[#1A1A1A]"
              >
                Try Again
              </Button>

              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-6 text-base font-medium text-[#111418] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-slate-700/50 dark:focus:ring-offset-[#1A1A1A] dark:focus:ring-slate-500"
              >
                Go to Homepage
              </Button>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && error.digest && (
              <div className="mt-6 text-left">
                <details className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-mono overflow-auto">
                    <p className="mb-1">
                      <span className="font-semibold">Digest:</span> {error.digest}
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">Message:</span> {error.message}
                    </p>
                    {error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap break-words">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
