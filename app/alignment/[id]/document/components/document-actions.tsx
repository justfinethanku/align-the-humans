/**
 * Document Actions Component
 * Download and share actions for completed agreements
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Check, Loader2 } from 'lucide-react';

interface DocumentActionsProps {
  alignmentId: string;
  alignmentTitle: string;
}

export function DocumentActions({
  alignmentId,
  alignmentTitle
}: DocumentActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    try {
      setDownloading(true);
      const content = document.getElementById('alignment-document');
      if (!content) {
        throw new Error('Unable to locate document content for export.');
      }

      const html2pdfModule: any = (await import('html2pdf.js')).default;
      const safeTitle = alignmentTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'alignment-agreement';

      await html2pdfModule()
        .set({
          filename: `${safeTitle}.pdf`,
          margin: 0.5,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .from(content)
        .save();
    } catch (err) {
      console.error('Failed to download agreement PDF:', err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/alignment/${alignmentId}/document`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Agreement
              </>
            )}
          </Button>

          {/* Share Link Button */}
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </>
            )}
          </Button>

        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Keep a copy of this agreement for your records. Both parties can access this document
          at any time from their dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
