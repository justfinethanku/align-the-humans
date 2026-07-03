/**
 * Join Alignment Page (Public)
 *
 * Handles invitation link flow for joining alignments.
 * This page is PUBLIC and accessible without authentication.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createServerClient, getCurrentUser } from '@/app/lib/supabase-server';
import { hashToken, isValidTokenFormat } from '@/app/lib/invite-tokens';
import JoinAlignmentClient from './JoinAlignmentClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

type InviteStatus = 'not_found' | 'revoked' | 'expired' | 'used' | 'closed';

interface StatusCopy {
  title: string;
  message: string;
  tone: 'red' | 'amber' | 'muted';
  path: string;
}

const STATUS_COPY: Record<InviteStatus, StatusCopy> = {
  not_found: {
    title: 'Invitation Not Found',
    message: 'This invitation link does not exist or has been removed.',
    tone: 'red',
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  revoked: {
    title: 'Invitation Revoked',
    message: 'This invitation link has been revoked by the alignment creator.',
    tone: 'amber',
    path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  },
  expired: {
    title: 'Invitation Expired',
    message: 'This invitation link has expired. Please request a new invitation from the alignment creator.',
    tone: 'amber',
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  used: {
    title: 'Invitation Limit Reached',
    message: 'This invitation link has reached its usage limit. Please request a new invitation from the alignment creator.',
    tone: 'amber',
    path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  closed: {
    title: 'Alignment Completed',
    message: 'This alignment has been completed. Ask your partner to start a new alignment if you want to collaborate.',
    tone: 'muted',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

function ErrorCard({
  title,
  message,
  tone,
  path,
}: {
  title: string;
  message: string;
  tone: 'red' | 'amber' | 'muted';
  path: string;
}) {
  const toneClass = {
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    muted: 'bg-muted text-muted-foreground',
  }[tone];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-card border border-border p-8 shadow-lg">
          <div className="text-center">
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={path}
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {title}
            </h1>
            <p className="text-muted-foreground mb-6">
              {message}
            </p>
            <Button asChild className="h-12 rounded-lg px-6 text-base font-semibold">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvalidInvitationCard() {
  return (
    <ErrorCard
      title="Invalid Invitation Link"
      message="This invitation link is not valid. Please check the link and try again."
      tone="red"
      path="M6 18L18 6M6 6l12 12"
    />
  );
}

function getExpirationText(expiresAtValue: string | null): string {
  if (!expiresAtValue) return '';

  const expiresAt = new Date(expiresAtValue);
  const now = new Date();
  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration === 0) {
    return 'Expires today';
  }

  if (daysUntilExpiration === 1) {
    return 'Expires in 1 day';
  }

  if (daysUntilExpiration > 1) {
    return `Expires in ${daysUntilExpiration} days`;
  }

  return '';
}

/**
 * Server component that validates token and fetches alignment preview
 */
export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServerClient();

  if (!isValidTokenFormat(token)) {
    return <InvalidInvitationCard />;
  }

  const tokenHash = hashToken(token);
  const { data, error } = await supabase.rpc('get_alignment_invite_preview', {
    p_token_hash: tokenHash,
  });
  const preview = data?.[0];

  if (error || !preview) {
    return <ErrorCard {...STATUS_COPY.not_found} />;
  }

  if (preview.status === 'already_participant') {
    if (preview.redirect_alignment_id) {
      redirect(`/alignment/${preview.redirect_alignment_id}`);
    }

    return <ErrorCard {...STATUS_COPY.not_found} />;
  }

  if (preview.status !== 'valid') {
    const statusCopy =
      STATUS_COPY[preview.status as InviteStatus] ?? STATUS_COPY.not_found;
    return <ErrorCard {...statusCopy} />;
  }

  const user = await getCurrentUser(supabase);

  return (
    <JoinAlignmentClient
      token={token}
      alignment={{
        title: preview.title || 'Alignment',
        creatorName: preview.creator_name || 'Someone',
      }}
      isAuthenticated={!!user}
      expirationText={getExpirationText(preview.expires_at)}
    />
  );
}
