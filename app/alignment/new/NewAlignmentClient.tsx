'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  PieChart,
  Home,
  TrendingUp,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/app/lib/supabase-browser';

interface NewAlignmentClientProps {
  userId: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const templates: Template[] = [
  {
    id: 'operating_agreement',
    title: 'Operating Agreement',
    description: 'Business partnership foundations - roles, responsibilities, decision-making, and exit scenarios',
    icon: FileText,
  },
  {
    id: 'cofounder_equity',
    title: 'Cofounder Equity Split',
    description: 'Equity splits built on explicit shared values, not rushed compromise',
    icon: PieChart,
  },
  {
    id: 'roommate_agreement',
    title: 'Roommate Agreement',
    description: 'Household logistics - chores, expenses, shared spaces, and expectations',
    icon: Home,
  },
  {
    id: 'marketing_strategy',
    title: 'Marketing Strategy',
    description: 'Strategic direction from competing priorities and visions',
    icon: TrendingUp,
  },
  {
    id: 'business_operations',
    title: 'Business Operations',
    description: 'Operational decisions - processes, priorities, and resource allocation',
    icon: Briefcase,
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Any decision that needs structure - describe your situation',
    icon: Sparkles,
  },
];

export function NewAlignmentClient({ userId }: NewAlignmentClientProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleTemplateSelect = async (templateId: string) => {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Create alignment record with draft status (no partner required for solo start)
      const { data: alignment, error: alignmentError } = await supabase
        .from('alignments')
        .insert({
          title: templates.find((t) => t.id === templateId)?.title || 'New Alignment',
          status: 'draft',
          created_by: userId,
          partner_id: null as any, // Nullable after migration
        })
        .select()
        .single();

      if (alignmentError) {
        throw new Error(alignmentError.message);
      }

      if (!alignment) {
        throw new Error('Failed to create alignment');
      }

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('alignment_participants')
        .insert({
          alignment_id: alignment.id,
          user_id: userId,
          role: 'owner',
        });

      if (participantError) {
        throw new Error(participantError.message);
      }

      // Navigate to clarity page with template in query params
      router.push(`/alignment/${alignment.id}/clarity?template=${templateId}`);
    } catch (err) {
      console.error('Error creating alignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create alignment');
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customDescription.trim()) {
      setError('Please describe your alignment needs');
      return;
    }

    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Create alignment record with custom description (no partner required for solo start)
      const { data: alignment, error: alignmentError } = await supabase
        .from('alignments')
        .insert({
          title: customDescription.slice(0, 100), // Use first 100 chars as title
          status: 'draft',
          created_by: userId,
          partner_id: null as any, // Nullable after migration
        })
        .select()
        .single();

      if (alignmentError) {
        throw new Error(alignmentError.message);
      }

      if (!alignment) {
        throw new Error('Failed to create alignment');
      }

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('alignment_participants')
        .insert({
          alignment_id: alignment.id,
          user_id: userId,
          role: 'owner',
        });

      if (participantError) {
        throw new Error(participantError.message);
      }

      // Navigate to clarity page with custom template and description
      const encodedDescription = encodeURIComponent(customDescription);
      router.push(
        `/alignment/${alignment.id}/clarity?template=custom&description=${encodedDescription}`
      );
    } catch (err) {
      console.error('Error creating alignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create alignment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-default/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Align The Humans
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            disabled={isSubmitting}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-4 text-center mb-10">
            <div className="font-semibold text-primary-600 dark:text-primary-400">
              Step 1 of 5
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Start a New Alignment
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Choose a decision type below, or describe your specific situation. Same structure, any scale - from household logistics to business strategy.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
              {error}
            </div>
          )}

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                    isSelected
                      ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    if (template.id !== 'custom') {
                      handleTemplateSelect(template.id);
                    }
                  }}
                >
                  <CardHeader className="flex flex-col items-center text-center space-y-4 pb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-2 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                      {template.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className={`w-full ${
                        isSelected
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                      }`}
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template.id);
                        if (template.id !== 'custom') {
                          handleTemplateSelect(template.id);
                        }
                      }}
                    >
                      {isSubmitting && isSelected ? 'Creating...' : isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Custom Description Section */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Describe Your Decision
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Every decision is unique. Describe what you need to align on, and AI will create a tailored process for your specific situation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., 'My family needs to decide whether to relocate for a job opportunity and what factors matter most to each of us...'"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="min-h-[120px] bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={isSubmitting}
                aria-label="Custom alignment description"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                className="bg-primary-600 hover:bg-primary-700 text-white"
                onClick={handleCustomSubmit}
                disabled={isSubmitting || !customDescription.trim()}
              >
                {isSubmitting && selectedTemplate === 'custom'
                  ? 'Creating...'
                  : 'Continue with Custom'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
