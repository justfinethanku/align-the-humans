'use client';

/**
 * Resolution Form Component
 *
 * Client-side form for resolving conflicts through:
 * - Selecting AI-suggested compromises
 * - Accepting positions
 * - Writing custom solutions
 * - Requesting AI assistance
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import type { ConflictItem } from '@/app/lib/types';

interface ResolutionFormProps {
  alignmentId: string;
  conflicts: ConflictItem[];
  currentRound: number;
  partnerName: string;
  hasUserSubmitted: boolean;
  hasPartnerSubmitted: boolean;
}

interface ConflictResolution {
  conflict_id: string;
  resolution_type: 'ai_suggestion' | 'accept_own' | 'accept_partner' | 'custom';
  selected_option?: string;
  custom_solution?: string;
}

interface AIAssistance {
  examples?: string[];
  implications?: string[];
  suggestions?: string[];
}

export function ResolutionForm({
  alignmentId,
  conflicts,
  currentRound,
  partnerName,
  hasUserSubmitted,
  hasPartnerSubmitted,
}: ResolutionFormProps) {
  const router = useRouter();
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [aiAssistance, setAiAssistance] = useState<Record<string, AIAssistance>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConflict = conflicts[currentConflictIndex];

  // Initialize resolutions state
  useEffect(() => {
    const initialResolutions: Record<string, ConflictResolution> = {};
    conflicts.forEach(conflict => {
      initialResolutions[conflict.question_id] = {
        conflict_id: conflict.question_id,
        resolution_type: 'ai_suggestion',
      };
    });
    setResolutions(initialResolutions);
  }, [conflicts]);

  // Handle resolution selection
  const handleResolutionChange = (conflictId: string, value: string) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: {
        ...prev[conflictId],
        resolution_type: value.startsWith('suggestion_')
          ? 'ai_suggestion'
          : value as ConflictResolution['resolution_type'],
        selected_option: value.startsWith('suggestion_') ? value : undefined,
        custom_solution: value === 'custom' ? prev[conflictId]?.custom_solution || '' : undefined,
      },
    }));
  };

  // Handle custom solution input
  const handleCustomSolutionChange = (conflictId: string, value: string) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: {
        ...prev[conflictId],
        custom_solution: value,
      },
    }));
  };

  // Fetch AI examples
  const fetchExamples = async (conflict: ConflictItem) => {
    setLoadingAI('examples');
    setError(null);

    try {
      const response = await fetch('/api/alignment/resolve-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alignmentId,
          conflict: {
            topic: conflict.description,
            personA: conflict.user1_response,
            personB: conflict.user2_response,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }

      const data = await response.json();
      setAiAssistance(prev => ({
        ...prev,
        [conflict.question_id]: {
          ...prev[conflict.question_id],
          examples: data.data.examples,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch examples');
    } finally {
      setLoadingAI(null);
    }
  };

  // Fetch AI implications
  const fetchImplications = async (conflict: ConflictItem) => {
    setLoadingAI('implications');
    setError(null);

    try {
      const response = await fetch('/api/alignment/resolve-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alignmentId,
          conflict: {
            topic: conflict.description,
            personA: conflict.user1_response,
            personB: conflict.user2_response,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI implications');
      }

      const data = await response.json();
      setAiAssistance(prev => ({
        ...prev,
        [conflict.question_id]: {
          ...prev[conflict.question_id],
          implications: data.data.implications,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch implications');
    } finally {
      setLoadingAI(null);
    }
  };

  // Fetch AI suggestions (additional compromises)
  const fetchSuggestions = async (conflict: ConflictItem) => {
    setLoadingAI('suggestions');
    setError(null);

    try {
      const response = await fetch('/api/alignment/resolve-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alignmentId,
          conflict: {
            topic: conflict.description,
            personA: conflict.user1_response,
            personB: conflict.user2_response,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }

      const data = await response.json();
      setAiAssistance(prev => ({
        ...prev,
        [conflict.question_id]: {
          ...prev[conflict.question_id],
          suggestions: data.data.options.map((opt: any) => opt.summary),
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setLoadingAI(null);
    }
  };

  // Submit resolutions
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Validate all conflicts have resolutions
      const incompleteResolutions = conflicts.filter(
        conflict => !resolutions[conflict.question_id] ||
          (resolutions[conflict.question_id].resolution_type === 'custom' &&
            !resolutions[conflict.question_id].custom_solution?.trim())
      );

      if (incompleteResolutions.length > 0) {
        setError('Please provide resolutions for all conflicts');
        setSubmitting(false);
        return;
      }

      // Save resolutions as alignment response
      const response = await fetch(`/api/alignment/${alignmentId}/submit-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: currentRound,
          resolutions: Object.values(resolutions),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to submit resolutions');
      }

      // Redirect based on partner status
      if (hasPartnerSubmitted) {
        // Both submitted, trigger re-analysis
        router.push(`/alignment/${alignmentId}/analysis?reanalyze=true`);
      } else {
        // Waiting for partner
        router.push(`/alignment/${alignmentId}/analysis?waiting=true`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit resolutions');
      setSubmitting(false);
    }
  };

  // Get severity badge variant
  const getSeverityVariant = (severity: ConflictItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // If already submitted, show waiting state
  if (hasUserSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <Badge variant="default" className="px-4 py-2 text-base">
          Round {currentRound}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Waiting for {partnerName}
        </h1>
        <p className="max-w-2xl text-center text-lg text-muted-foreground">
          You have submitted your resolutions. Once {partnerName} submits theirs, we will
          re-analyze to see if alignment has been reached.
        </p>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="default" className="px-4 py-2 text-base">
          Round {currentRound}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Resolve Conflicts
        </h1>
        <p className="text-lg text-muted-foreground">
          Work through each conflict to find solutions that work for both of you.
        </p>
        <div className="text-sm text-muted-foreground">
          Conflict {currentConflictIndex + 1} of {conflicts.length}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Conflict */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{currentConflict.description}</CardTitle>
              <CardDescription>
                This conflict was identified by AI analysis of your responses
              </CardDescription>
            </div>
            <Badge variant={getSeverityVariant(currentConflict.severity)}>
              {currentConflict.severity}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Positions */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{String(currentConflict.user1_response)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{partnerName}&apos;s Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{String(currentConflict.user2_response)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Options */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Resolution</CardTitle>
          <CardDescription>
            Select an AI-suggested compromise, accept a position, or propose your own solution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={resolutions[currentConflict.question_id]?.selected_option || resolutions[currentConflict.question_id]?.resolution_type}
            onValueChange={(value) => handleResolutionChange(currentConflict.question_id, value)}
          >
            {/* AI Suggestions */}
            {currentConflict.suggested_resolution && (
              <div className="flex items-start space-x-3 rounded-lg border border-input p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="suggestion_0" id={`suggestion_0_${currentConflict.question_id}`} />
                <Label
                  htmlFor={`suggestion_0_${currentConflict.question_id}`}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="font-medium">AI Compromise</div>
                  <div className="text-sm text-muted-foreground">
                    {currentConflict.suggested_resolution}
                  </div>
                </Label>
              </div>
            )}

            {/* Additional AI suggestions from assistance */}
            {aiAssistance[currentConflict.question_id]?.suggestions?.map((suggestion, idx) => (
              <div key={idx} className="flex items-start space-x-3 rounded-lg border border-input p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value={`suggestion_${idx + 1}`} id={`suggestion_${idx + 1}_${currentConflict.question_id}`} />
                <Label
                  htmlFor={`suggestion_${idx + 1}_${currentConflict.question_id}`}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="font-medium">AI Compromise {idx + 2}</div>
                  <div className="text-sm text-muted-foreground">{suggestion}</div>
                </Label>
              </div>
            ))}

            {/* Accept Own Position */}
            <div className="flex items-start space-x-3 rounded-lg border border-input p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="accept_own" id={`accept_own_${currentConflict.question_id}`} />
              <Label
                htmlFor={`accept_own_${currentConflict.question_id}`}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="font-medium">Accept My Position</div>
                <div className="text-sm text-muted-foreground">
                  I believe my position is the best path forward
                </div>
              </Label>
            </div>

            {/* Accept Partner Position */}
            <div className="flex items-start space-x-3 rounded-lg border border-input p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="accept_partner" id={`accept_partner_${currentConflict.question_id}`} />
              <Label
                htmlFor={`accept_partner_${currentConflict.question_id}`}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="font-medium">Accept {partnerName}&apos;s Position</div>
                <div className="text-sm text-muted-foreground">
                  I agree with {partnerName}&apos;s position on this
                </div>
              </Label>
            </div>

            {/* Custom Solution */}
            <div className="flex flex-col space-y-3 rounded-lg border border-input p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="custom" id={`custom_${currentConflict.question_id}`} />
                <Label
                  htmlFor={`custom_${currentConflict.question_id}`}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="font-medium">Propose Custom Solution</div>
                  <div className="text-sm text-muted-foreground">
                    Write your own path forward
                  </div>
                </Label>
              </div>
              {resolutions[currentConflict.question_id]?.resolution_type === 'custom' && (
                <Textarea
                  value={resolutions[currentConflict.question_id]?.custom_solution || ''}
                  onChange={(e) => handleCustomSolutionChange(currentConflict.question_id, e.target.value)}
                  placeholder="e.g., We will both research three options and present our findings next week..."
                  rows={4}
                  className="mt-2"
                />
              )}
            </div>
          </RadioGroup>

          {/* AI Assistance Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-4 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchExamples(currentConflict)}
              disabled={loadingAI === 'examples'}
            >
              {loadingAI === 'examples' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              Show Examples
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchImplications(currentConflict)}
              disabled={loadingAI === 'implications'}
            >
              {loadingAI === 'implications' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Show Implications
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchSuggestions(currentConflict)}
              disabled={loadingAI === 'suggestions'}
            >
              {loadingAI === 'suggestions' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              Suggest Middle Ground
            </Button>
          </div>

          {/* AI Assistance Display */}
          {aiAssistance[currentConflict.question_id]?.examples && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {aiAssistance[currentConflict.question_id].examples!.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{String(example)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {aiAssistance[currentConflict.question_id]?.implications && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Implications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {aiAssistance[currentConflict.question_id].implications!.map((implication, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{String(implication)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentConflictIndex(Math.max(0, currentConflictIndex - 1))}
            disabled={currentConflictIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentConflictIndex(Math.min(conflicts.length - 1, currentConflictIndex + 1))}
            disabled={currentConflictIndex === conflicts.length - 1}
          >
            Next
          </Button>
        </div>

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Resolutions'
          )}
        </Button>
      </div>
    </div>
  );
}
