/**
 * Document Content Component
 * Renders the server-owned agreement document HTML.
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import DOMPurify from 'isomorphic-dompurify';

interface DocumentContentProps {
  documentHtml: string;
  snapshotHash: string;
  isFrozen: boolean;
}

export function DocumentContent({
  documentHtml,
  snapshotHash,
  isFrozen
}: DocumentContentProps) {
  const sanitizedHtml = DOMPurify.sanitize(documentHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div', 'section', 'article', 'span', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'footer'],
    ALLOWED_ATTR: ['class', 'id'],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false
  }) as string;

  return (
    <Card>
      <CardContent className="p-8">
        <div
          id="alignment-document"
          data-snapshot-hash={snapshotHash}
          data-snapshot-state={isFrozen ? 'frozen' : 'preview'}
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
            color: rgb(var(--foreground));
          }

          .document-content h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: rgb(var(--foreground));
            border-bottom: 2px solid rgb(var(--shadcn-border));
            padding-bottom: 0.5rem;
          }

          .document-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: rgb(var(--foreground));
          }

          .document-content p {
            margin-bottom: 1rem;
            line-height: 1.7;
            color: rgb(var(--foreground));
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
            border-bottom: 3px solid rgb(var(--shadcn-border));
          }

          .document-content .document-meta {
            margin-top: 1rem;
            color: rgb(var(--muted-foreground));
          }

          .document-content .document-meta p {
            margin-bottom: 0.25rem;
            font-size: 0.95rem;
          }

          .document-content .executive-summary {
            background-color: rgb(var(--muted) / 0.3);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 2rem;
          }

          .document-content section {
            margin-bottom: 2rem;
          }

          .document-content .document-footer,
          .document-content .document-disclaimer {
            page-break-inside: avoid;
            break-inside: avoid;
          }

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
