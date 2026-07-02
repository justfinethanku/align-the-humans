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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
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
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something Went Wrong
            </h1>

            {/* Error Message */}
            <p className="text-muted-foreground mb-6">
              {error.message || 'An unexpected error occurred while loading this invitation.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                className="h-12 w-full text-base font-semibold"
              >
                Try Again
              </Button>

              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="h-12 w-full text-base font-medium"
              >
                Go to Homepage
              </Button>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && error.digest && (
              <div className="mt-6 text-left">
                <details className="rounded-lg border border-border bg-muted p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs text-muted-foreground font-mono overflow-auto">
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
