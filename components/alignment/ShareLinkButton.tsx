'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link, Copy, Check, RefreshCw, Share2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShareLinkButtonProps {
  alignmentId: string;
  className?: string;
}

interface InviteData {
  invite_url: string;
  expires_at: string;
  token: string;
  max_uses?: number | null;
  current_uses?: number | null;
}

export function ShareLinkButton({ alignmentId, className }: ShareLinkButtonProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch current invite on mount
  const loadInvite = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/alignment/${alignmentId}/invite`);

      if (response.status === 404) {
        setInviteData(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch invite');
      }

      const data: InviteData = await response.json();
      setInviteData(data);
    } catch (error) {
      console.error('Error fetching invite:', error);
      setInviteData(null);
      setLoadError('Failed to load share link');
      toast.error('Failed to load share link');
    } finally {
      setLoading(false);
    }
  }, [alignmentId]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  // Calculate expiration countdown
  useEffect(() => {
    if (!inviteData?.expires_at) return;

    const calculateDaysRemaining = () => {
      const expiresAt = new Date(inviteData.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setExpiresInDays(diffDays);
    };

    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [inviteData]);

  const handleCopy = async () => {
    if (!inviteData?.invite_url) return;

    try {
      await navigator.clipboard.writeText(inviteData.invite_url);
      setCopied(true);
      toast.success('Link copied to clipboard!');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleMobileShare = async () => {
    if (!inviteData?.invite_url) return;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Alignment',
          text: 'Join me in this alignment on Human Alignment',
          url: inviteData.invite_url,
        });
        toast.success('Share successful!');
      } catch (error) {
        // User cancelled share
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
          toast.error('Failed to share link');
        }
      }
    } else {
      // Fallback to copy on desktop
      void handleCopy();
    }
  };

  const createInvite = async (endpoint: string, mutation: 'generate' | 'regenerate') => {
    mutation === 'generate' ? setIsGenerating(true) : setRegenerating(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create invite');
      }

      const data: InviteData = await response.json();
      setInviteData(data);

      toast.success(
        mutation === 'generate' ? 'Share link created!' : 'New share link generated!',
        mutation === 'regenerate'
          ? { description: 'The old link will no longer work.' }
          : undefined
      );
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to generate link');
      if (mutation === 'generate') {
        setInviteData(null);
      }
    } finally {
      mutation === 'generate' ? setIsGenerating(false) : setRegenerating(false);
      setLoadError(null);
    }
  };

  const handleGenerate = async () => {
    await createInvite(`/api/alignment/${alignmentId}/generate-invite`, 'generate');
  };

  const handleRegenerate = async () => {
    setShowRegenerateDialog(false);

    await createInvite(`/api/alignment/${alignmentId}/regenerate-invite`, 'regenerate');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading share link...</span>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
          <p className="text-sm">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvite}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!inviteData) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 space-y-4 text-center text-slate-600 dark:text-slate-400">
          <p className="text-sm">
            No invite link yet. Generate one to share with your partner.
          </p>
          <Button
            onClick={handleGenerate}
            size="sm"
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Generate Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const showExpirationWarning = expiresInDays !== null && expiresInDays < 7;

  return (
    <>
      <Card className={className}>
        <CardContent className="pt-6 space-y-4">
          {/* Share Link Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <Link className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={inviteData.invite_url}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none truncate"
                aria-label="Invite link"
              />
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={regenerating}
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success-600 dark:text-success-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Expiration Info */}
          {expiresInDays !== null && (
            <div className={`flex items-center gap-2 text-xs ${
              showExpirationWarning
                ? 'text-warning-700 dark:text-warning-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              <Clock className="h-3 w-3" />
              <span>
                {expiresInDays > 0
                  ? `Expires in ${expiresInDays} day${expiresInDays === 1 ? '' : 's'}`
                  : 'Expires today'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mobile Share Button (shows only on mobile devices with share API) */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <Button
                onClick={handleMobileShare}
                variant="default"
                size="sm"
                className="flex-1"
                disabled={regenerating}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}

            {/* Regenerate Button */}
            <Button
              onClick={() => setShowRegenerateDialog(true)}
              variant="outline"
              size="sm"
              disabled={regenerating}
              className="flex-1"
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Share Link?</DialogTitle>
            <DialogDescription>
              This will create a new share link and invalidate the current one. The old link will
              immediately stop working. Your partner will need the new link to join.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRegenerate}
            >
              Regenerate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
