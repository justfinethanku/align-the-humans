/**
 * Executive Summary Component
 * Displays key terms and metadata at a glance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ExecutiveSummaryProps {
  alignmentTitle: string;
  dateFinalized: string;
  participants: string[];
  keyTerms: string[];
}

export function ExecutiveSummary({
  alignmentTitle,
  dateFinalized,
  participants,
  keyTerms
}: ExecutiveSummaryProps) {
  const formattedDate = new Date(dateFinalized).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Official Agreement</CardTitle>
        <p className="text-muted-foreground">{alignmentTitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Metadata Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Date Finalized</p>
            <p className="text-base font-semibold">{formattedDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Participants</p>
            <p className="text-base font-semibold">{participants.join(' and ')}</p>
          </div>
        </div>

        <Separator />

        {/* Key Terms Summary */}
        {keyTerms.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Key Terms</h3>
            <p className="text-sm text-muted-foreground">
              This document constitutes the full and final agreement between the participants listed above.
              Please review all sections carefully before providing your digital signature.
            </p>
            <ul className="space-y-2 mt-4">
              {keyTerms.map((term, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-primary font-semibold shrink-0">•</span>
                  <span className="text-sm">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
