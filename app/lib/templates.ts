/**
 * Curated Fallback Templates
 *
 * Pre-configured question sets for common alignment scenarios.
 * Used as fallback when AI generation fails and as few-shot examples
 * for improving AI generation quality.
 *
 * Based on plan_a.md lines 817-824
 */

import { AlignmentQuestion } from './types';

/**
 * Operating Agreement template for business co-founders
 */
export const operatingAgreementTemplate: AlignmentQuestion[] = [
  {
    id: 'equity_split',
    prompt: 'How should equity be split between founders?',
    description: 'Consider factors like initial investment, roles, responsibilities, and future contributions.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain common equity split models and their implications',
      examplePrompt: 'Show examples of fair equity splits in different scenarios',
      suggestionPrompt: 'Suggest an equitable split based on the described contributions',
    },
    metadata: {
      category: 'equity',
      importance: 'critical',
    },
  },
  {
    id: 'vesting_schedule',
    prompt: 'What vesting schedule should apply to founder equity?',
    description: 'Vesting protects the company if a founder leaves early.',
    type: 'multiple_choice',
    required: true,
    options: [
      { id: 'no_vesting', label: 'No vesting period' },
      { id: 'one_year_cliff', label: '1-year cliff, then monthly vesting over 4 years' },
      { id: 'immediate_25', label: '25% immediate, rest over 3 years' },
      { id: 'custom', label: 'Custom vesting schedule' },
    ],
    aiHints: {
      explainPrompt: 'Explain the purpose and benefits of equity vesting',
      examplePrompt: 'Show real-world examples of vesting schedules',
      suggestionPrompt: 'Recommend a vesting structure based on company stage',
    },
    metadata: {
      category: 'equity',
      importance: 'high',
    },
  },
  {
    id: 'decision_making',
    prompt: 'How will major business decisions be made?',
    description: 'Define the decision-making process for strategic choices, hiring, spending, etc.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain different governance models for startups',
      examplePrompt: 'Show examples of decision-making frameworks',
      suggestionPrompt: 'Suggest a governance structure based on team size and dynamics',
    },
    metadata: {
      category: 'governance',
      importance: 'critical',
    },
  },
  {
    id: 'roles_responsibilities',
    prompt: 'What are each founder\'s primary roles and responsibilities?',
    description: 'Clearly define who is responsible for what areas of the business.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain the importance of clear role definition',
      examplePrompt: 'Show examples of founder role divisions',
      suggestionPrompt: 'Suggest role allocation based on skills and experience',
    },
    metadata: {
      category: 'operations',
      importance: 'high',
    },
  },
  {
    id: 'conflict_resolution',
    prompt: 'How will conflicts between founders be resolved?',
    description: 'Establish a process for handling disagreements before they escalate.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain effective conflict resolution strategies',
      examplePrompt: 'Show examples of founder conflict resolution clauses',
      suggestionPrompt: 'Suggest a conflict resolution process',
    },
    metadata: {
      category: 'governance',
      importance: 'high',
    },
  },
  {
    id: 'time_commitment',
    prompt: 'What is the expected time commitment for each founder?',
    description: 'Define whether founders are working full-time, part-time, or have other obligations.',
    type: 'multiple_choice',
    required: true,
    options: [
      { id: 'full_time_all', label: 'All founders full-time' },
      { id: 'mixed', label: 'Mixed: some full-time, some part-time' },
      { id: 'part_time_all', label: 'All founders part-time' },
      { id: 'flexible', label: 'Flexible based on company needs' },
    ],
    aiHints: {
      explainPrompt: 'Explain how time commitment affects equity and roles',
      examplePrompt: 'Show examples of time commitment arrangements',
      suggestionPrompt: 'Suggest fair equity adjustments based on time commitment',
    },
    metadata: {
      category: 'operations',
      importance: 'high',
    },
  },
  {
    id: 'ip_ownership',
    prompt: 'How will intellectual property be owned and protected?',
    description: 'Clarify ownership of existing and future IP, patents, trademarks, etc.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain intellectual property ownership in startups',
      examplePrompt: 'Show examples of IP assignment clauses',
      suggestionPrompt: 'Suggest IP protection strategies',
    },
    metadata: {
      category: 'legal',
      importance: 'critical',
    },
  },
  {
    id: 'founder_exit',
    prompt: 'What happens if a founder wants to leave or must be removed?',
    description: 'Define exit procedures, equity buyback terms, and transition processes.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain founder exit scenarios and best practices',
      examplePrompt: 'Show examples of founder exit clauses',
      suggestionPrompt: 'Suggest fair exit terms',
    },
    metadata: {
      category: 'legal',
      importance: 'critical',
    },
  },
];

/**
 * Custom template - minimal starter for any topic
 */
export const customTemplate: AlignmentQuestion[] = [
  {
    id: 'primary_goal',
    prompt: 'What is the primary goal you want to achieve together?',
    description: 'Be specific about what success looks like.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain the importance of clear goal-setting',
      examplePrompt: 'Show examples of well-defined goals',
      suggestionPrompt: 'Help refine and clarify the stated goal',
    },
    metadata: {
      category: 'foundation',
      importance: 'critical',
    },
  },
  {
    id: 'key_concerns',
    prompt: 'What are your main concerns or priorities?',
    description: 'List what matters most to you in this agreement.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain how to identify and prioritize concerns',
      examplePrompt: 'Show examples of common concerns in similar situations',
      suggestionPrompt: 'Suggest additional concerns to consider',
    },
    metadata: {
      category: 'foundation',
      importance: 'high',
    },
  },
  {
    id: 'expectations',
    prompt: 'What are your expectations from your partner(s)?',
    description: 'Describe what you need from the other party to make this work.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain the importance of clear expectations',
      examplePrompt: 'Show examples of well-articulated expectations',
      suggestionPrompt: 'Suggest ways to communicate expectations effectively',
    },
    metadata: {
      category: 'foundation',
      importance: 'high',
    },
  },
  {
    id: 'success_criteria',
    prompt: 'How will you measure success?',
    description: 'Define concrete metrics or outcomes that indicate the agreement is working.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain how to define measurable success criteria',
      examplePrompt: 'Show examples of effective success metrics',
      suggestionPrompt: 'Suggest relevant success indicators',
    },
    metadata: {
      category: 'foundation',
      importance: 'high',
    },
  },
  {
    id: 'deal_breakers',
    prompt: 'What are your non-negotiable requirements (deal-breakers)?',
    description: 'Identify conditions that would make you unable to proceed with this agreement.',
    type: 'long_text',
    required: false,
    aiHints: {
      explainPrompt: 'Explain the role of deal-breakers in negotiations',
      examplePrompt: 'Show examples of reasonable deal-breakers',
      suggestionPrompt: 'Help evaluate whether stated deal-breakers are reasonable',
    },
    metadata: {
      category: 'boundaries',
      importance: 'medium',
    },
  },
];

/**
 * Cofounder Equity template
 */
export const cofounderEquityTemplate: AlignmentQuestion[] = [
  {
    id: 'equity_ratio',
    prompt: 'What equity split do you believe is fair for this partnership?',
    description: 'Consider contributions like capital, time, skills, network, and risk tolerance.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain factors that typically influence equity splits',
      examplePrompt: 'Show examples of common equity arrangements',
      suggestionPrompt: 'Suggest an equitable split based on contributions',
    },
    metadata: { category: 'equity', importance: 'critical' },
  },
  {
    id: 'contribution_types',
    prompt: 'What are you contributing to this partnership?',
    description: 'List your contributions: capital, skills, time, network, IP, etc.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain different types of contributions and their value',
      examplePrompt: 'Show examples of contribution lists',
      suggestionPrompt: 'Help identify contributions you might have overlooked',
    },
    metadata: { category: 'contributions', importance: 'critical' },
  },
  {
    id: 'vesting_preference',
    prompt: 'What vesting arrangement feels fair to you?',
    type: 'multiple_choice',
    required: true,
    options: [
      { id: 'standard_4yr', label: '4-year vesting with 1-year cliff' },
      { id: 'no_vesting', label: 'No vesting (immediate full ownership)' },
      { id: 'custom_vesting', label: 'Custom vesting schedule' },
      { id: 'milestone_based', label: 'Milestone-based vesting' },
    ],
    metadata: { category: 'equity', importance: 'high' },
  },
  {
    id: 'dilution_expectations',
    prompt: 'How should future dilution be handled?',
    description: 'When raising capital or adding partners, how should existing equity be affected?',
    type: 'long_text',
    required: true,
    metadata: { category: 'equity', importance: 'high' },
  },
  {
    id: 'sweat_equity_value',
    prompt: 'How do you value time/work contributions vs. capital contributions?',
    type: 'long_text',
    required: true,
    metadata: { category: 'contributions', importance: 'high' },
  },
];

/**
 * Roommate Agreement template
 */
export const roommateAgreementTemplate: AlignmentQuestion[] = [
  {
    id: 'chore_division',
    prompt: 'How should household chores be divided?',
    description: 'Consider cleaning, dishes, taking out trash, groceries, etc.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain different approaches to dividing household responsibilities',
      examplePrompt: 'Show examples of chore schedules',
      suggestionPrompt: 'Suggest a fair chore division approach',
    },
    metadata: { category: 'responsibilities', importance: 'high' },
  },
  {
    id: 'expense_sharing',
    prompt: 'How should shared expenses be split?',
    description: 'Rent, utilities, internet, household supplies, etc.',
    type: 'multiple_choice',
    required: true,
    options: [
      { id: 'equal_split', label: 'Split everything 50/50' },
      { id: 'proportional', label: 'Proportional to income' },
      { id: 'by_usage', label: 'Based on usage/space' },
      { id: 'custom', label: 'Custom arrangement' },
    ],
    metadata: { category: 'financial', importance: 'critical' },
  },
  {
    id: 'guest_policy',
    prompt: 'What are your expectations around having guests over?',
    description: 'Overnight guests, parties, advance notice, etc.',
    type: 'long_text',
    required: true,
    metadata: { category: 'boundaries', importance: 'high' },
  },
  {
    id: 'quiet_hours',
    prompt: 'What quiet hours or noise boundaries do you need?',
    type: 'long_text',
    required: true,
    metadata: { category: 'boundaries', importance: 'high' },
  },
  {
    id: 'shared_spaces',
    prompt: 'How should shared spaces (kitchen, living room, bathroom) be used?',
    type: 'long_text',
    required: true,
    metadata: { category: 'shared_spaces', importance: 'medium' },
  },
];

/**
 * Marketing Strategy template
 */
export const marketingStrategyTemplate: AlignmentQuestion[] = [
  {
    id: 'target_audience',
    prompt: 'Who is your primary target audience?',
    description: 'Describe demographics, psychographics, and behavior patterns.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain how to define a target audience',
      examplePrompt: 'Show examples of target audience profiles',
      suggestionPrompt: 'Help refine audience definition',
    },
    metadata: { category: 'audience', importance: 'critical' },
  },
  {
    id: 'key_channels',
    prompt: 'Which marketing channels should be prioritized?',
    type: 'checkbox',
    required: true,
    options: [
      { id: 'social_media', label: 'Social media (organic)' },
      { id: 'paid_ads', label: 'Paid advertising' },
      { id: 'content_marketing', label: 'Content marketing/SEO' },
      { id: 'email', label: 'Email marketing' },
      { id: 'events', label: 'Events/conferences' },
      { id: 'partnerships', label: 'Partnerships/affiliates' },
    ],
    metadata: { category: 'channels', importance: 'high' },
  },
  {
    id: 'budget_allocation',
    prompt: 'How should the marketing budget be allocated?',
    type: 'long_text',
    required: true,
    metadata: { category: 'budget', importance: 'high' },
  },
  {
    id: 'brand_voice',
    prompt: 'What should our brand voice and tone be?',
    type: 'long_text',
    required: true,
    metadata: { category: 'brand', importance: 'medium' },
  },
  {
    id: 'success_metrics',
    prompt: 'How will we measure marketing success?',
    type: 'long_text',
    required: true,
    metadata: { category: 'metrics', importance: 'high' },
  },
];

/**
 * Business Operations template
 */
export const businessOperationsTemplate: AlignmentQuestion[] = [
  {
    id: 'decision_authority',
    prompt: 'How should operational decisions be made and who has final authority?',
    description: 'Consider day-to-day decisions vs. major strategic choices.',
    type: 'long_text',
    required: true,
    aiHints: {
      explainPrompt: 'Explain different decision-making frameworks',
      examplePrompt: 'Show examples of authority structures',
      suggestionPrompt: 'Suggest a decision framework based on your context',
    },
    metadata: { category: 'governance', importance: 'critical' },
  },
  {
    id: 'communication_cadence',
    prompt: 'How often and through what channels should we communicate about operations?',
    type: 'multiple_choice',
    required: true,
    options: [
      { id: 'daily_standup', label: 'Daily standups' },
      { id: 'weekly_sync', label: 'Weekly sync meetings' },
      { id: 'async_tools', label: 'Primarily async (Slack/email)' },
      { id: 'as_needed', label: 'As-needed basis' },
    ],
    metadata: { category: 'communication', importance: 'high' },
  },
  {
    id: 'resource_allocation',
    prompt: 'How should resources (budget, people, time) be prioritized?',
    type: 'long_text',
    required: true,
    metadata: { category: 'resources', importance: 'high' },
  },
  {
    id: 'process_documentation',
    prompt: 'How important is documenting processes and creating SOPs?',
    type: 'scale',
    required: true,
    options: [
      { id: '1', label: 'Not important' },
      { id: '5', label: 'Moderately important' },
      { id: '10', label: 'Extremely important' },
    ],
    metadata: { category: 'operations', importance: 'medium', min: 1, max: 10 },
  },
  {
    id: 'vendor_selection',
    prompt: 'What criteria should guide vendor and tool selection?',
    type: 'long_text',
    required: true,
    metadata: { category: 'procurement', importance: 'medium' },
  },
];

/**
 * Template registry mapping seed types to templates
 */
export const templateRegistry: Record<string, AlignmentQuestion[]> = {
  operating_agreement: operatingAgreementTemplate,
  cofounder_equity: cofounderEquityTemplate,
  roommate_agreement: roommateAgreementTemplate,
  marketing_strategy: marketingStrategyTemplate,
  business_operations: businessOperationsTemplate,
  custom: customTemplate,
};

/**
 * Gets fallback template by seed type
 * @param seedType Template seed identifier
 * @returns Array of curated questions
 */
export function getFallbackTemplate(seedType: string): AlignmentQuestion[] {
  return templateRegistry[seedType] || customTemplate;
}

/**
 * Validates that a question has all required fields
 * @param question Question to validate
 * @returns true if valid
 */
export function isValidQuestion(question: unknown): question is AlignmentQuestion {
  if (typeof question !== 'object' || question === null) return false;

  const q = question as Record<string, unknown>;

  // Required fields
  if (typeof q.id !== 'string' || q.id.length === 0) return false;
  if (typeof q.prompt !== 'string' || q.prompt.length === 0) return false;
  if (typeof q.type !== 'string') return false;
  if (typeof q.required !== 'boolean') return false;

  // Validate type
  const validTypes = ['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale'];
  if (!validTypes.includes(q.type as string)) return false;

  // If options exist, validate structure
  if (q.options !== undefined) {
    if (!Array.isArray(q.options)) return false;
    for (const opt of q.options) {
      if (typeof opt !== 'object' || opt === null) return false;
      if (typeof opt.id !== 'string' || typeof opt.label !== 'string') return false;
    }
  }

  return true;
}

/**
 * Sanitizes AI-generated questions to remove any sensitive data
 * @param questions Questions to sanitize
 * @returns Sanitized questions
 */
export function sanitizeQuestions(questions: AlignmentQuestion[]): AlignmentQuestion[] {
  return questions.map(q => ({
    ...q,
    // Remove any potential PII from prompts/descriptions
    prompt: q.prompt.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]'),
    description: q.description?.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]'),
    // Recursively sanitize follow-up questions
    followUps: q.followUps ? sanitizeQuestions(q.followUps) : undefined,
  }));
}
