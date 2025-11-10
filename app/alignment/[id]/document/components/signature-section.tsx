/**
 * Signature Section Component
 * Handles digital signature collection and display
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, PenLine, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignatureSectionProps {
  alignmentId: string;
  round: number;
  currentUserId: string;
  currentUserName: string;
  partnerUserId: string;
  partnerName: string;
  currentUserSignature: any | null;
  partnerSignature: any | null;
  allSigned: boolean;
}

export function SignatureSection({
  alignmentId,
  round,
  currentUserId,
  currentUserName,
  partnerUserId,
  partnerName,
  currentUserSignature,
  partnerSignature,
  allSigned
}: SignatureSectionProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUserSigned = !!currentUserSignature;
  const hasPartnerSigned = !!partnerSignature;

  async function handleSign() {
    if (!agreed) return;

    try {
      setSigning(true);
      setError(null);

      const response = await fetch(`/api/alignment/${alignmentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to sign agreement');
      }

      // Refresh the page to show updated signature status
      router.refresh();

    } catch (err) {
      console.error('Signature error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Digital Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Participant A Signature Box */}
        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Participant A: {currentUserName}</p>
              {hasUserSigned && currentUserSignature && (
                <p className="text-sm text-muted-foreground mt-1">
                  Signed on {formatTimestamp(currentUserSignature.created_at)}
                </p>
              )}
            </div>
            {hasUserSigned && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
          </div>

          {!hasUserSigned && (
            <div className="bg-muted/30 rounded p-4 text-center text-muted-foreground">
              <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Draw or type your signature here</p>
            </div>
          )}

          {hasUserSigned && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                You have signed this agreement
              </p>
            </div>
          )}
        </div>

        {/* Participant B Signature Box */}
        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Participant B: {partnerName}</p>
              {hasPartnerSigned && partnerSignature && (
                <p className="text-sm text-muted-foreground mt-1">
                  Signed on {formatTimestamp(partnerSignature.created_at)}
                </p>
              )}
            </div>
            {hasPartnerSigned && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
          </div>

          {!hasPartnerSigned && (
            <div className="bg-muted/30 rounded p-4 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Awaiting signature...</p>
            </div>
          )}

          {hasPartnerSigned && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {partnerName} has signed this agreement
              </p>
            </div>
          )}
        </div>

        {/* Signature Action */}
        {!hasUserSigned && (
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
                I agree to the terms outlined in this document and understand that my digital
                signature is legally binding. I have reviewed all sections carefully and consent
                to be bound by these terms.
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
                  Signing Agreement...
                </>
              ) : (
                <>
                  <PenLine className="mr-2 h-4 w-4" />
                  Sign Agreement
                </>
              )}
            </Button>
          </div>
        )}

        {hasUserSigned && !hasPartnerSigned && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Waiting for {partnerName} to sign
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              They will be notified to review and sign the agreement
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
              Both parties have signed. This agreement is now legally binding.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
