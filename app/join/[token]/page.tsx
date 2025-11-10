/**
 * Join Alignment Page (Public)
 *
 * Handles invitation link flow for joining alignments.
 * This page is PUBLIC and accessible without authentication.
 *
 * Flow:
 * 1. Extract token from URL params
 * 2. Validate token and fetch alignment preview (server-side)
 * 3. Check authentication status
 * 4. Show appropriate UI based on state
 *
 * States:
 * - Valid token + Not logged in → Show auth CTAs
 * - Valid token + Logged in → Show join button
 * - Invalid/Expired token → Show error message
 * - Already participant → Show redirect to alignment
 */

import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { hashToken, isValidTokenFormat } from '@/app/lib/invite-tokens';
import { redirect } from 'next/navigation';
import JoinAlignmentClient from './JoinAlignmentClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Server component that validates token and fetches alignment preview
 */
export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServerClient();

  // Validate token format first
  if (!isValidTokenFormat(token)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
            <div className="text-center">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                Invalid Invitation Link
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This invitation link is not valid. Please check the link and try again.
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hash token and look up invitation
  const tokenHash = hashToken(token);

  const { data: invitation, error: inviteError } = await supabase
    .from('alignment_invitations')
    .select(`
      id,
      alignment_id,
      expires_at,
      max_uses,
      current_uses,
      invalidated_at,
      alignment:alignments!inner(
        id,
        title,
        description,
        status,
        created_by,
        creator:profiles!alignments_created_by_fkey(
          display_name
        )
      )
    `)
    .eq('token_hash', tokenHash)
    .single();

  // Check if invitation exists
  if (inviteError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
            <div className="text-center">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                Invitation Not Found
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This invitation link does not exist or has been removed.
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type assertion for alignment data
  const alignment = invitation.alignment as unknown as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_by: string;
    creator: { display_name: string | null }[] | { display_name: string | null };
  };

  // Extract creator name (handle array or object)
  const creatorName = Array.isArray(alignment.creator)
    ? alignment.creator[0]?.display_name || 'Unknown'
    : alignment.creator?.display_name || 'Unknown';

  // Check if invitation is invalidated
  if (invitation.invalidated_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                Invitation Revoked
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This invitation link has been revoked by the alignment creator.
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  const now = new Date();
  if (invitation.expires_at) {
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                  <svg
                    className="h-6 w-6 text-amber-600 dark:text-amber-400"
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
                </div>
                <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                  Invitation Expired
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  This invitation link has expired. Please request a new invitation from the alignment creator.
                </p>
                <a
                  href="/"
                  className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check if usage limit reached
  if ((invitation.current_uses ?? 0) >= (invitation.max_uses ?? 1)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                Invitation Limit Reached
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This invitation link has reached its usage limit. Please request a new invitation from the alignment creator.
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if alignment is cancelled or complete
  if (alignment.status === 'cancelled' || alignment.status === 'complete') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-[#252525] p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <svg
                  className="h-6 w-6 text-slate-600 dark:text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">
                {alignment.status === 'complete' ? 'Alignment Completed' : 'Alignment Cancelled'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {alignment.status === 'complete'
                  ? 'This alignment has been completed. Ask your partner to start a new alignment if you want to collaborate.'
                  : 'This alignment has been cancelled and is no longer active.'}
              </p>
              <a
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check current user authentication
  const user = await getCurrentUser(supabase);

  // If user is authenticated, check if they're already a participant
  if (user) {
    const { data: existingParticipant } = await supabase
      .from('alignment_participants')
      .select('id')
      .eq('alignment_id', alignment.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipant) {
      // User is already a participant, redirect to alignment
      redirect(`/alignment/${alignment.id}/clarity`);
    }
  }

  // Calculate days until expiration
  let expirationText = '';
  if (invitation.expires_at) {
    const expiresAt = new Date(invitation.expires_at);
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration === 0) {
      expirationText = 'Expires today';
    } else if (daysUntilExpiration === 1) {
      expirationText = 'Expires in 1 day';
    } else if (daysUntilExpiration > 1) {
      expirationText = `Expires in ${daysUntilExpiration} days`;
    }
  }

  // Render preview with client component
  return (
    <JoinAlignmentClient
      token={token}
      alignment={{
        id: alignment.id,
        title: alignment.title,
        description: alignment.description || '',
        creatorName,
      }}
      isAuthenticated={!!user}
      expirationText={expirationText}
    />
  );
}
