/**
 * Signature Section Component
 * Handles digital signature collection and display.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, PenLine, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatAgreementTimestamp } from '@/app/lib/document-dates';

interface SignatureParticipantView {
  userId: string;
  displayName: string;
  role: 'owner' | 'partner';
  signature: {
    id: string;
    created_at: string;
    agreement_snapshot_hash: string | null;
  } | null;
}

interface SignatureSectionProps {
  alignmentId: string;
  round: number;
  reviewedSnapshotHash: string;
  currentUserId: string;
  participants: SignatureParticipantView[];
  allSigned: boolean;
}

function roleLabel(role: SignatureParticipantView['role']): string {
  return role === 'owner' ? 'Owner' : 'Partner';
}

export function SignatureSection({
  alignmentId,
  round,
  reviewedSnapshotHash,
  currentUserId,
  participants,
  allSigned
}: SignatureSectionProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentParticipant = participants.find((participant) => participant.userId === currentUserId);
  const hasUserSigned = !!currentParticipant?.signature;
  const remainingParticipants = participants.filter((participant) => !participant.signature);

  async function handleSign() {
    if (!agreed) return;

    try {
      setSigning(true);
      setError(null);

      const response = await fetch(`/api/alignment/${alignmentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round,
          reviewedSnapshotHash,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error?.code === 'DOCUMENT_REVIEW_REQUIRED') {
          setAgreed(false);
          setError(
            data.error?.details?.currentSnapshotHash
              ? 'This agreement changed after you opened the page. Review the refreshed document before signing.'
              : data.error?.message || 'Review the current agreement before signing.'
          );
          router.refresh();
          return;
        }
        throw new Error(data.error?.message || 'Failed to sign agreement');
      }

      router.refresh();

    } catch (err) {
      console.error('Signature error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  }

  const formatTimestamp = formatAgreementTimestamp;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Digital Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {participants.map((participant) => {
          const isCurrentUser = participant.userId === currentUserId;
          const signature = participant.signature;

          return (
            <div
              key={participant.userId}
              className="signature-participant-row border-2 border-dashed rounded-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {roleLabel(participant.role)}: {participant.displayName}
                    {isCurrentUser ? ' (you)' : ''}
                  </p>
                  {signature && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Signed on {formatTimestamp(signature.created_at)}
                    </p>
                  )}
                </div>
                {signature ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <Clock className="h-6 w-6 text-muted-foreground shrink-0" />
                )}
              </div>

              {signature ? (
                <div className="bg-green-50 dark:bg-green-950/20 rounded p-4 text-center">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Signature confirmed
                  </p>
                </div>
              ) : (
                <div className="bg-muted/30 rounded p-4 text-center text-muted-foreground">
                  {isCurrentUser ? (
                    <>
                      <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Ready for your digital signature</p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Awaiting signature</p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!hasUserSigned && currentParticipant && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <Label
                htmlFor="agree-terms"
                className="text-sm leading-relaxed cursor-pointer"
              >
                Confirm your digital signature as {currentParticipant.displayName}. I have reviewed
                the agreement document and consent to sign these terms.
              </Label>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              onClick={handleSign}
              disabled={!agreed || signing}
              size="lg"
              className="w-full"
            >
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming Signature...
                </>
              ) : (
                <>
                  <PenLine className="mr-2 h-4 w-4" />
                  Confirm Signature
                </>
              )}
            </Button>
          </div>
        )}

        {hasUserSigned && remainingParticipants.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Waiting for {remainingParticipants.map((participant) => participant.displayName).join(', ')} to sign
            </p>
          </div>
        )}

        {allSigned && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
              Agreement Fully Executed
            </p>
            <p className="text-sm text-muted-foreground">
              Both parties have signed this agreement.
            </p>
          </div>
        )}

        <style jsx global>{`
          @media print {
            .signature-participant-row {
              page-break-inside: avoid;
            }
          }
        `}</style>

      </CardContent>
    </Card>
  );
}
