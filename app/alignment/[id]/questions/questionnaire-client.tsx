'use client';

/**
 * Questionnaire Client Component
 *
 * Handles form state, question rendering, AI assistance, and auto-save.
 * Implements all 6 question types with validation.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlignmentQuestion, ResponseAnswers, AnswerValue, AlignmentStatus } from '@/app/lib/types';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import {
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CloudCheck,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionnaireClientProps {
  alignmentId: string;
  questions: AlignmentQuestion[];
  existingAnswers: ResponseAnswers;
  alignmentTitle: string;
  partnerName: string;
  currentRound: number;
  alignmentStatus: AlignmentStatus;
}

interface AIAssistance {
  questionId: string;
  mode: 'explain' | 'examples' | 'suggest';
  text: string;
  confidence: number;
}

export function QuestionnaireClient({
  alignmentId,
  questions,
  existingAnswers,
  alignmentTitle,
  partnerName,
  currentRound,
  alignmentStatus,
}: QuestionnaireClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [answers, setAnswers] = useState<{ [questionId: string]: AnswerValue }>(
    existingAnswers.answers || {}
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errors, setErrors] = useState<{ [questionId: string]: string }>({});

  // AI assistance state
  const [aiAssistance, setAiAssistance] = useState<AIAssistance | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Validation
  const [showValidation, setShowValidation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Calculate completion
  const answeredCount = Object.keys(answers).filter((key) => {
    const answer = answers[key];
    if (answer?.value === null || answer?.value === undefined) return false;
    if (typeof answer.value === 'string' && answer.value.trim() === '') return false;
    if (Array.isArray(answer.value) && answer.value.length === 0) return false;
    return true;
  }).length;

  /**
   * Auto-save answers to database
   */
  const saveAnswers = useCallback(async () => {
    try {
      setSaveStatus('saving');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const responseData: ResponseAnswers = {
        response_version: 1,
        answers,
        metadata: {
          device: navigator.userAgent,
          lastUpdated: new Date().toISOString(),
        },
      };

      const { error } = await supabase
        .from('alignment_responses')
        .upsert(
          {
            alignment_id: alignmentId,
            user_id: user.id,
            round: currentRound,
            answers: responseData as any,
            metadata: (responseData.metadata || null) as any,
          },
          {
            onConflict: 'alignment_id,user_id,round',
          }
        );

      if (error) throw error;

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('idle');
    }
  }, [alignmentId, answers, currentRound, supabase]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, saveAnswers]);

  /**
   * Update answer for a question
   */
  const updateAnswer = (questionId: string, value: AnswerValue['value']) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        value,
        timestamp: new Date().toISOString(),
      },
    }));

    // Clear error for this question
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  };

  /**
   * Validate current question
   */
  const validateQuestion = (question: AlignmentQuestion): boolean => {
    if (!question.required) return true;

    const answer = answers[question.id];
    if (!answer || answer.value === null || answer.value === undefined) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: 'This question is required',
      }));
      return false;
    }

    if (typeof answer.value === 'string' && answer.value.trim() === '') {
      setErrors((prev) => ({
        ...prev,
        [question.id]: 'This question is required',
      }));
      return false;
    }

    if (Array.isArray(answer.value) && answer.value.length === 0) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: 'Please select at least one option',
      }));
      return false;
    }

    return true;
  };

  /**
   * Navigate to next question
   */
  const handleNext = () => {
    setShowValidation(true);

    if (validateQuestion(currentQuestion)) {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowValidation(false);
        setAiAssistance(null);
      }
    }
  };

  /**
   * Navigate to previous question
   */
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setShowValidation(false);
      setAiAssistance(null);
    }
  };

  /**
   * Get AI assistance
   */
  const getAIAssistance = async (mode: 'explain' | 'examples' | 'suggest') => {
    try {
      setAiLoading(true);
      setAiAssistance(null);

      const response = await fetch('/api/alignment/get-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alignmentId,
          question: {
            id: currentQuestion.id,
            type: currentQuestion.type,
            text: currentQuestion.prompt,
            required: currentQuestion.required,
            options: currentQuestion.options?.map((o) => o.label),
            help_text: currentQuestion.description,
          },
          currentAnswer: answers[currentQuestion.id]?.value?.toString() || null,
          mode,
          alignmentContext: {
            topic: alignmentTitle,
            round: currentRound,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI assistance');
      }

      const data = await response.json();
      setAiAssistance({
        questionId: currentQuestion.id,
        mode,
        text: data.data.text,
        confidence: data.data.confidence,
      });
    } catch (error) {
      console.error('AI assistance error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Submit final responses
   */
  const handleSubmit = async () => {
    setShowValidation(true);

    // Validate all required questions
    const allValid = questions.every((q) => validateQuestion(q));

    if (!allValid) {
      alert('Please answer all required questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Mark as submitted
      const { error } = await supabase
        .from('alignment_responses')
        .update({
          submitted_at: new Date().toISOString(),
        })
        .eq('alignment_id', alignmentId)
        .eq('user_id', user.id)
        .eq('round', currentRound);

      if (error) throw error;

      // Update alignment status to 'active'
      await supabase
        .from('alignments')
        .update({ status: 'active' })
        .eq('id', alignmentId);

      // Redirect to waiting page
      router.push(`/alignment/${alignmentId}/waiting`);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            No Questions Available
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Questions have not been generated yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-background/80 backdrop-blur-lg dark:border-slate-800">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
              <svg
                className="h-7 w-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z"
                  fill="currentColor"
                />
                <path
                  d="M12 6C9.239 6 7 8.239 7 11C7 13.761 9.239 16 12 16C14.761 16 17 13.761 17 11C17 8.239 14.761 6 12 6ZM12 14C10.343 14 9 12.657 9 11C9 9.343 10.343 8 12 8C13.657 8 15 9.343 15 11C15 12.657 13.657 14 12 14Z"
                  fill="currentColor"
                />
              </svg>
              <span>Align The Humans</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex w-full flex-1 flex-col items-center">
        <div className="w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Saving...</p>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CloudCheck className="h-4 w-4" />
                    <p>Saved</p>
                  </>
                )}
              </div>
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </div>

          {/* Question Card */}
          <main className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-4">
                  {currentQuestion.metadata?.category && typeof currentQuestion.metadata.category === 'string' ? (
                    <Badge
                      variant="outline"
                      className="self-start rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20"
                    >
                      {currentQuestion.metadata.category}
                    </Badge>
                  ) : null}
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                    {currentQuestion.prompt}
                  </h1>
                  {currentQuestion.description && (
                    <p className="text-base text-slate-600 dark:text-slate-400">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>

                {/* AI Assistance Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => getAIAssistance('explain')}
                    disabled={aiLoading}
                    title="Explain this question"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => getAIAssistance('examples')}
                    disabled={aiLoading}
                    title="Show examples"
                  >
                    <Lightbulb className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => getAIAssistance('suggest')}
                    disabled={aiLoading}
                    title="Get suggestions"
                  >
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* AI Assistance Display */}
              {aiAssistance && aiAssistance.questionId === currentQuestion.id && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {aiAssistance.mode === 'explain' && <HelpCircle className="h-5 w-5 text-primary" />}
                      {aiAssistance.mode === 'examples' && <Lightbulb className="h-5 w-5 text-primary" />}
                      {aiAssistance.mode === 'suggest' && <Sparkles className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {aiAssistance.mode === 'explain' && 'Explanation'}
                        {aiAssistance.mode === 'examples' && 'Examples'}
                        {aiAssistance.mode === 'suggest' && 'Suggestion'}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                        {aiAssistance.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Question Input */}
              <div>
                <QuestionInput
                  question={currentQuestion}
                  value={answers[currentQuestion.id]?.value}
                  onChange={(value) => updateAnswer(currentQuestion.id, value)}
                  error={showValidation ? errors[currentQuestion.id] : undefined}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex w-full items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Responses
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Question Input Component
 * Renders appropriate input based on question type
 */
interface QuestionInputProps {
  question: AlignmentQuestion;
  value: AnswerValue['value'] | undefined;
  onChange: (value: AnswerValue['value']) => void;
  error?: string;
}

function QuestionInput({ question, value, onChange, error }: QuestionInputProps) {
  switch (question.type) {
    case 'short_text':
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={(question.metadata?.placeholder as string) || 'Type your answer here...'}
            className={cn(
              'text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${question.id}-error` : undefined}
          />
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    case 'long_text':
      return (
        <div className="space-y-2">
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={(question.metadata?.placeholder as string) || 'Type your answer here...'}
            rows={6}
            className={cn(
              'text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${question.id}-error` : undefined}
          />
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-3">
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={onChange}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                <Label
                  htmlFor={`${question.id}-${option.id}`}
                  className="text-base font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    case 'checkbox':
      const selectedValues = (value as string[]) || [];
      return (
        <div className="space-y-3">
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <Checkbox
                id={`${question.id}-${option.id}`}
                checked={selectedValues.includes(option.id)}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    onChange([...selectedValues, option.id]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== option.id));
                  }
                }}
              />
              <Label
                htmlFor={`${question.id}-${option.id}`}
                className="text-base font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            min={(question.metadata as any)?.min}
            max={(question.metadata as any)?.max}
            placeholder={question.metadata?.placeholder as string || 'Enter a number...'}
            className={cn(
              'text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${question.id}-error` : undefined}
          />
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    case 'scale':
      const numericValue = typeof value === 'number' ? value : ((question.metadata as any)?.min || 0);
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>{(question.metadata as any)?.min || 0}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {numericValue}
            </span>
            <span>{(question.metadata as any)?.max || 10}</span>
          </div>
          <Slider
            value={[numericValue]}
            onValueChange={(values: number[]) => onChange(values[0])}
            min={(question.metadata as any)?.min || 0}
            max={(question.metadata as any)?.max || 10}
            step={1}
            className="w-full"
          />
          {error && (
            <p id={`${question.id}-error`} className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );

    default:
      return (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Unsupported question type: {question.type}
        </p>
      );
  }
}
