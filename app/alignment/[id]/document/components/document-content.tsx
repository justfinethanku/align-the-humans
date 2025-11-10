/**
 * Document Content Component
 * Renders the AI-generated agreement document HTML
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

interface DocumentContentProps {
  alignmentId: string;
  templateId: string | null;
  alignmentTitle: string;
  participants: string[];
  dateFinalized: string;
  analysis: any;
}

export function DocumentContent({
  alignmentId,
  templateId,
  alignmentTitle,
  participants,
  dateFinalized,
  analysis
}: DocumentContentProps) {
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateDocument() {
      try {
        setLoading(true);
        setError(null);

        if (!templateId) {
          throw new Error('Template not found for this alignment');
        }

        // Prepare final positions from analysis
        const finalPositions: Record<string, unknown> = {};

        if (analysis?.summary?.agreements) {
          analysis.summary.agreements.forEach((agreement: any, index: number) => {
            finalPositions[`term_${index + 1}`] = {
              description: agreement.description,
              value: agreement.shared_value
            };
          });
        }

        // Generate executive summary points
        const summaryPoints = analysis?.summary?.agreements
          ?.slice(0, 5)
          .map((a: any) => a.description) || [];

        const response = await fetch('/api/alignment/generate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alignmentId,
            templateId,
            finalPositions,
            participants,
            summary: summaryPoints.length > 0 ? summaryPoints : ['Agreement reached on all key terms']
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate document');
        }

        const data = await response.json();
        setDocumentHtml(data.data.documentHtml);

      } catch (err) {
        console.error('Document generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate document');
      } finally {
        setLoading(false);
      }
    }

    generateDocument();
  }, [alignmentId, templateId, alignmentTitle, participants, dateFinalized, analysis]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your agreement document...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Error Loading Document</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sanitize HTML to prevent XSS attacks
  const sanitizedHtml = documentHtml ? DOMPurify.sanitize(documentHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div', 'section', 'article', 'span', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['class', 'id'],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false
  }) : '';

  return (
    <Card>
      <CardContent className="p-8">
        {/* Document HTML Container - Sanitized to prevent XSS */}
        <div
          id="alignment-document"
          className="document-content prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />

        <style jsx global>{`
          .document-content {
            font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          }

          .document-content h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: hsl(var(--foreground));
          }

          .document-content h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: hsl(var(--foreground));
            border-bottom: 2px solid hsl(var(--border));
            padding-bottom: 0.5rem;
          }

          .document-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: hsl(var(--foreground));
          }

          .document-content p {
            margin-bottom: 1rem;
            line-height: 1.7;
            color: hsl(var(--foreground));
          }

          .document-content ul {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }

          .document-content li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
          }

          .document-content .document-header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 3px solid hsl(var(--border));
          }

          .document-content .document-meta {
            margin-top: 1rem;
            color: hsl(var(--muted-foreground));
          }

          .document-content .document-meta p {
            margin-bottom: 0.25rem;
            font-size: 0.95rem;
          }

          .document-content .executive-summary {
            background-color: hsl(var(--muted) / 0.3);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 2rem;
          }

          .document-content section {
            margin-bottom: 2rem;
          }

          /* Print styles */
          @media print {
            .document-content {
              font-size: 11pt;
              line-height: 1.5;
            }

            .document-content h1 {
              font-size: 18pt;
              page-break-after: avoid;
            }

            .document-content h2 {
              font-size: 14pt;
              page-break-after: avoid;
            }

            .document-content h3 {
              font-size: 12pt;
              page-break-after: avoid;
            }

            .document-content section {
              page-break-inside: avoid;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
