/**
 * Join Alignment Client Component
 *
 * Client-side interactive component for joining an alignment via invite link.
 * Handles join button interaction, loading states, and error display.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JoinAlignmentClientProps {
  token: string;
  alignment: {
    id: string;
    title: string;
    description: string;
    creatorName: string;
  };
  isAuthenticated: boolean;
  expirationText: string;
}

export default function JoinAlignmentClient({
  token,
  alignment,
  isAuthenticated,
  expirationText,
}: JoinAlignmentClientProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles join button click
   * Sends POST request to /api/alignment/join with token
   */
  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/alignment/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.error?.message || 'Failed to join alignment';
        setError(errorMessage);
        setIsJoining(false);
        return;
      }

      // Success - redirect to alignment clarity page
      router.push(`/alignment/${alignment.id}/clarity`);
    } catch (err) {
      console.error('Join alignment error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };

  /**
   * Handles sign in button click
   * Redirects to login with return URL
   */
  const handleSignIn = () => {
    const returnUrl = `/join/${token}`;
    router.push(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
  };

  /**
   * Handles create account button click
   * Redirects to signup with return URL
   */
  const handleCreateAccount = () => {
    const returnUrl = `/join/${token}`;
    router.push(`/signup?redirectTo=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
      <div className="w-full max-w-2xl">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <svg
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-blue-600 dark:text-blue-500"
            >
              <g clipPath="url(#clip0_6_319)">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
              </g>
              <defs>
                <clipPath id="clip0_6_319">
                  <rect fill="white" height="48" width="48" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#111418] dark:text-white">
            You&apos;re Invited to Join an Alignment
          </h1>
        </div>

        {/* Alignment Preview Card */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <div className="p-6 sm:p-8">
            {/* Alignment Title */}
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-3">
              {alignment.title}
            </h2>

            {/* Alignment Description */}
            {alignment.description && (
              <p className="text-base text-slate-600 dark:text-slate-300 mb-4 line-clamp-4">
                {alignment.description}
              </p>
            )}

            {/* Creator Info */}
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="h-5 w-5 text-slate-500 dark:text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Shared by <span className="font-medium text-slate-700 dark:text-slate-200">{alignment.creatorName}</span>
              </span>
            </div>

            {/* Expiration Info */}
            {expirationText && (
              <div className="flex items-center gap-2 mb-6">
                <svg
                  className="h-5 w-5 text-slate-500 dark:text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {expirationText}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3">
              {isAuthenticated ? (
                // Authenticated user - Show join button
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-[#1A1A1A]"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    'Join Alignment'
                  )}
                </Button>
              ) : (
                // Not authenticated - Show auth buttons
                <>
                  <Button
                    onClick={handleSignIn}
                    className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-[#1A1A1A]"
                  >
                    Sign in to Join
                  </Button>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative bg-white dark:bg-[#252525] px-2 text-sm text-slate-400 dark:text-slate-500">
                      OR
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateAccount}
                    variant="outline"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-6 text-base font-medium text-[#111418] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-slate-700/50 dark:focus:ring-offset-[#1A1A1A] dark:focus:ring-slate-500"
                  >
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Info Text */}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          By joining, you&apos;ll think through this decision independently, then collaborate to discover solutions together.
        </p>
      </div>
    </div>
  );
}
