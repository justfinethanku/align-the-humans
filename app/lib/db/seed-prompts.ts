/**
 * Prompt Seed Data
 *
 * All hardcoded AI prompts extracted from API routes,
 * ready to be inserted into the prompts table.
 *
 * Run via: npx tsx app/lib/db/seed-prompts.ts
 */

import type { NewPrompt } from './types';

export const PROMPT_SEEDS: Omit<NewPrompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ============================================================================
  // 1. Analyze Responses - Main alignment analysis
  // ============================================================================
  {
    slug: 'analyze-responses',
    name: 'Analyze Alignment Responses',
    description: 'Compares both participants\' responses to identify agreements, conflicts, hidden assumptions, gaps, and power imbalances.',
    category: 'alignment',
    model: 'claude-sonnet-4-6',
    temperature: '0.30',
    maxTokens: 4096,
    systemPrompt: 'You are an expert alignment analyst. Your role is to thoroughly analyze two people\'s responses to alignment questions and provide actionable insights.',
    userPromptTemplate: `You are analyzing two people's responses to alignment questions. Your goal is to identify areas of agreement, conflicts, hidden assumptions, gaps, and power imbalances.

**Person A's Responses:**
{{responseA}}

**Person B's Responses:**
{{responseB}}

Analyze these responses thoroughly and provide:

1. **ALIGNED ITEMS**: Areas where they completely agree. Be specific about what they agree on and why it's significant.

2. **CONFLICTS**: Disagreements or misalignments. Categorize each by severity:
   - **critical**: Fundamental disagreements that could prevent alignment
   - **moderate**: Important differences that need resolution
   - **minor**: Small differences that can be easily addressed

   For each conflict:
   - Identify the specific question/topic
   - Clearly state each person's position
   - Provide 2-3 concrete suggestions for resolution

3. **HIDDEN ASSUMPTIONS**: Things one person assumes that the other hasn't addressed. These are often unstated expectations that could cause future problems.

4. **GAPS**: Important topics that NEITHER person has adequately addressed. Suggest questions they should consider.

5. **IMBALANCES**: Structural issues in the relationship that could cause problems:
   - Power imbalances
   - Unequal contributions or expectations
   - One-sided arrangements
   - Lack of reciprocity

6. **OVERALL ALIGNMENT SCORE**: A score from 0-100 indicating overall alignment level.
   - 90-100: Excellent alignment, minor refinement needed
   - 70-89: Good alignment, some important conflicts to resolve
   - 50-69: Moderate alignment, significant work needed
   - 30-49: Poor alignment, fundamental disagreements
   - 0-29: Very poor alignment, may need to reconsider

Be thorough, specific, and actionable in your analysis. Focus on helping both parties understand each other's perspectives and find common ground.`,
    outputSchema: {
      type: 'analysisSchema',
      description: 'Structured analysis with alignedItems, conflicts, hiddenAssumptions, gaps, imbalances, overall_alignment_score',
    },
    isActive: true,
  },

  // ============================================================================
  // 2. Generate Document - Final agreement
  // ============================================================================
  {
    slug: 'generate-document',
    name: 'Generate Agreement Document',
    description: 'Generates a professional HTML agreement document from aligned positions.',
    category: 'alignment',
    model: 'claude-sonnet-4-6',
    temperature: '0.50',
    maxTokens: 4000,
    systemPrompt: 'You are a professional document generator specializing in creating clear, well-structured alignment agreements.',
    userPromptTemplate: `Generate a professional alignment agreement document.

Context:
- Template type: {{templateName}}
- Category: {{templateCategory}}
- Participants: {{participantList}}
- Aligned positions:
{{positionsJson}}

Executive Summary Points:
{{summaryBullets}}

Create a well-structured HTML document with:
1. An executive summary section with 3-5 bullet points highlighting key agreements
2. Detailed terms organized by logical categories
3. Professional but readable language suitable for a legally-binding agreement
4. Include reasoning and context where helpful to clarify decisions
5. Use proper HTML semantic structure (article, section, h1, h2, h3, p, ul, li)

Format requirements:
- Use <article> as the root element
- Use <section> tags for major divisions
- Use <h2> for category headings and <h3> for subsections
- Use <p> for paragraphs and <ul>/<li> for lists
- Add appropriate class names for styling
- Include a header with document title, participants, and date
- Do NOT include <html>, <head>, or <body> tags - just the article content

Generate a complete, professional document now.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 3. Resolve Conflicts - Solution discovery
  // ============================================================================
  {
    slug: 'resolve-conflicts',
    name: 'Discover Solutions',
    description: 'Generates creative solutions by synthesizing both perspectives. Focuses on discovery over compromise.',
    category: 'alignment',
    model: 'claude-sonnet-4-6',
    temperature: '0.70',
    maxTokens: 4096,
    systemPrompt: 'You are an expert facilitator helping people discover new solutions through collaborative intelligence.',
    userPromptTemplate: `You are an expert facilitator helping two people discover new solutions by synthesizing their independent thinking.

DECISION DETAILS:
Topic: {{topic}}
Person A's Perspective: {{personA}}
Person B's Perspective: {{personB}}{{constraintsSection}}

YOUR TASK:
Analyze both perspectives deeply to discover 3-4 solutions that neither person may have considered alone. These should NOT be simple compromises - look for:

1. Synthesis opportunities: Where both perspectives reveal a third option neither suggested
2. Hidden shared values: What both people actually want underneath their stated positions
3. False dichotomies: Are they treating this as either/or when it could be both/and?
4. Unstated assumptions: What are they each assuming that might not be true?
5. Creative reframes: Is there a different way to think about this decision entirely?

For each discovered solution, provide:
- A clear summary of the solution
- Specific pros (benefits for both people)
- Specific cons (trade-offs, challenges)
- Actionable next steps (3-5 concrete actions)

Additionally, provide:
- 2-3 implications: What discovering these solutions reveals about shared priorities
- 2-3 examples: Real-world precedents where similar synthesis approaches worked

IMPORTANT GUIDELINES:
- Seek discovery, not compromise
- Look beneath positions to find needs/values
- Be specific, not vague
- Honor both perspectives
- Think generatively

Generate solutions that demonstrate collaborative intelligence.`,
    outputSchema: {
      type: 'ConflictResolutionSchema',
      description: 'Structured with options (3-4), implications, and examples',
    },
    isActive: true,
  },

  // ============================================================================
  // 4. Inline Suggestion - Explain mode
  // ============================================================================
  {
    slug: 'suggestion-explain',
    name: 'Question Explanation',
    description: 'Explains what an alignment question is asking and why it matters.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.50',
    maxTokens: 300,
    systemPrompt: 'You are a helpful alignment assistant that explains questions clearly and concisely.',
    userPromptTemplate: `You are helping someone understand a question in an alignment conversation about "{{topic}}".

Question: "{{questionText}}"
{{helpText}}

Provide a clear, concise explanation (2-3 sentences) of what this question is asking for and why it matters in the context of reaching mutual agreement. Be helpful and supportive.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 5. Inline Suggestion - Examples mode
  // ============================================================================
  {
    slug: 'suggestion-examples',
    name: 'Answer Examples',
    description: 'Provides realistic example answers to alignment questions.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.50',
    maxTokens: 300,
    systemPrompt: 'You are a helpful alignment assistant that provides diverse, realistic examples.',
    userPromptTemplate: `You are helping someone answer a question in an alignment conversation about "{{topic}}".

Question: "{{questionText}}"
{{helpText}}

Provide 2-3 relevant, realistic examples of how different people might answer this question. Keep examples concise (1-2 sentences each) and diverse to show the range of valid responses.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 6. Inline Suggestion - Suggest mode
  // ============================================================================
  {
    slug: 'suggestion-suggest',
    name: 'Answer Suggestion',
    description: 'Suggests thoughtful starting points or improvements for alignment answers.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.70',
    maxTokens: 300,
    systemPrompt: 'You are a supportive alignment assistant that suggests thoughtful answers without being directive.',
    userPromptTemplate: `You are helping someone thoughtfully answer a question in an alignment conversation about "{{topic}}".

Question: "{{questionText}}"
{{helpText}}
{{currentAnswer}}

{{suggestionInstruction}}

Keep your suggestion concise (2-4 sentences) and supportive. Frame it as a helpful suggestion, not a directive.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 7. Generate Questions - AI question generation
  // ============================================================================
  {
    slug: 'generate-questions',
    name: 'Generate Alignment Questions',
    description: 'Creates thoughtful question sets based on topic and template type.',
    category: 'alignment',
    model: 'claude-sonnet-4-6',
    temperature: '0.70',
    maxTokens: 4096,
    systemPrompt: 'You are an expert facilitator who creates thoughtful, specific questions that help people articulate what matters to them.',
    userPromptTemplate: `You are an expert facilitator helping two people think through a decision together. Generate a thoughtful set of 5-10 questions that will help each person articulate what matters to them before collaborative synthesis begins.

Context:
- Topic: {{topic}}
- Participants: {{participants}}
- Desired Outcome: {{desiredOutcome}}
- Template Type: {{templateSeed}}

Guidelines:
1. Generate 5-10 questions (no more, no less)
2. Mix question types: use long_text for open-ended, multiple_choice for discrete options, scale for preferences
3. Make questions specific to the topic and desired outcome
4. Each question should have a clear, actionable prompt
5. Include helpful descriptions that guide users
6. For multiple_choice and scale questions, provide 3-5 relevant options
7. Add AI hints for user assistance
8. Use snake_case for question IDs
9. Mark critical questions as required: true
10. Consider follow-up questions for complex topics

{{focusAreas}}

Generate questions that cover the most critical aspects while staying relevant to: "{{topic}}".`,
    outputSchema: {
      type: 'AlignmentQuestionsArraySchema',
      description: 'Array of question objects with id, type, text, required, options, etc.',
    },
    isActive: true,
  },

  // ============================================================================
  // 8. Clarity Suggest - Topic suggestions
  // ============================================================================
  {
    slug: 'clarity-suggest-topic',
    name: 'Topic Suggestions',
    description: 'Suggests clear, specific alignment topics based on user input.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.70',
    maxTokens: 1024,
    systemPrompt: 'You are a helpful assistant that suggests clear, specific topics for alignment conversations.',
    userPromptTemplate: `You are helping someone define what they want to align on. Generate 2-3 clear, specific topic suggestions for an alignment conversation.

Current input: "{{currentValue}}"
Context: This is for a conversation between {{participants}}.

Provide 2-3 diverse, realistic examples of alignment topics. Each should be:
- Clear and specific (not vague)
- Realistic and relatable
- Different from each other
- 8-15 words long

Return only the topic suggestions, one per line, without numbering or explanations.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 9. Clarity Suggest - Partner suggestions
  // ============================================================================
  {
    slug: 'clarity-suggest-partner',
    name: 'Partner Suggestions',
    description: 'Suggests common relationship types for alignment context.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.70',
    maxTokens: 1024,
    systemPrompt: 'You are a helpful assistant that suggests relationship types for alignment conversations.',
    userPromptTemplate: `You are helping someone identify their partner for an alignment conversation. Generate 2-3 common relationship type suggestions.

Current input: "{{currentValue}}"
Topic: "{{topic}}"

Provide 2-3 common relationship types that make sense for this topic.

Return only the relationship descriptions, one per line, without numbering or explanations.`,
    outputSchema: null,
    isActive: true,
  },

  // ============================================================================
  // 10. Clarity Suggest - Outcome suggestions
  // ============================================================================
  {
    slug: 'clarity-suggest-outcome',
    name: 'Outcome Suggestions',
    description: 'Suggests desired outcomes for alignment conversations.',
    category: 'alignment',
    model: 'claude-haiku-4-5-20251001',
    temperature: '0.70',
    maxTokens: 1024,
    systemPrompt: 'You are a helpful assistant that suggests clear, achievable outcomes for alignment conversations.',
    userPromptTemplate: `You are helping someone define the desired outcome of an alignment conversation. Generate 2-3 clear outcome suggestions.

Current input: "{{currentValue}}"
Topic: "{{topic}}"
Participants: {{participants}}

Provide 2-3 realistic desired outcomes. Each should be:
- Clear and achievable
- Specific to reaching agreement
- Different from each other

Return only the outcome descriptions, one per line, without numbering or explanations.`,
    outputSchema: null,
    isActive: true,
  },
];
