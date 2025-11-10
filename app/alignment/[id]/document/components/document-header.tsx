/**
 * Document Header Component
 * Success message displayed at the top of the document page
 */

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DocumentHeaderProps {
  title: string;
  isComplete: boolean;
}

export function DocumentHeader({ title, isComplete }: DocumentHeaderProps) {
  return (
    <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-950/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-green-500 p-3 shrink-0">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                You&apos;ve reached alignment!
              </h1>
              {isComplete && (
                <Badge variant="outline" className="bg-green-500 text-white border-green-600">
                  Complete
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Below is the executive summary of the key terms agreed upon by the participants.
              This document is legally binding upon signature.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
