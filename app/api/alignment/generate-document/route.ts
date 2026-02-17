/**
 * API Route: Generate Final Alignment Document
 * POST /api/alignment/generate-document
 *
 * Generates a professional agreement document from aligned positions using Claude AI.
 * Returns HTML-formatted document with executive summary and detailed terms.
 *
 * Reference: plan_a.md lines 1147-1172, 1027-1044, 961-1008
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models, AI_MODELS, resolveModel } from '@/app/lib/ai-config';
import { getPrompt } from '@/app/lib/prompts';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import {
  createErrorResponse,
  ValidationError,
  AIError,
  AlignmentError,
  logError
} from '@/app/lib/errors';
import { z } from 'zod';

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Request body validation schema
 */
const GenerateDocumentRequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID format'),
  templateId: z.string().uuid('Invalid template ID format'),
  finalPositions: z.record(z.unknown()).describe('Aligned positions as key-value pairs'),
  participants: z.array(z.string()).min(2, 'At least 2 participants required'),
  summary: z.array(z.string()).min(1, 'Summary must contain at least 1 item'),
});

type GenerateDocumentRequest = z.infer<typeof GenerateDocumentRequestSchema>;

/**
 * Document section structure
 */
interface DocumentSection {
  id: string;
  heading: string;
  body: string;
}

/**
 * Response body structure
 */
interface GenerateDocumentResponse {
  data: {
    documentHtml: string;
    sections: DocumentSection[];
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses HTML document into sections
 * Extracts sections based on heading tags (h2, h3)
 */
function parseDocumentSections(html: string): DocumentSection[] {
  const sections: DocumentSection[] = [];

  // Match section patterns: <h2>Heading</h2> followed by content until next heading
  const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let match;
  let sectionIndex = 0;

  while ((match = sectionRegex.exec(html)) !== null) {
    const heading = match[1].replace(/<[^>]*>/g, '').trim(); // Strip HTML tags
    const body = match[2].trim();

    // Generate a URL-safe ID from the heading
    const id = heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `section-${sectionIndex}`;

    sections.push({
      id,
      heading,
      body,
    });

    sectionIndex++;
  }

  return sections;
}

/**
 * Validates user has access to alignment
 */
async function validateAlignmentAccess(
  supabase: ReturnType<typeof createServerClient>,
  alignmentId: string,
  userId: string
): Promise<void> {
  const { data: participant, error } = await supabase
    .from('alignment_participants')
    .select('id')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .single();

  if (error || !participant) {
    throw AlignmentError.unauthorized(alignmentId, userId);
  }
}

/**
 * Fetches template details for context
 */
async function getTemplateDetails(
  supabase: ReturnType<typeof createServerClient>,
  templateId: string
): Promise<{ name: string; category: string }> {
  const { data: template, error } = await supabase
    .from('templates')
    .select('name, content')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    throw new ValidationError('Template not found', { templateId });
  }

  const category = (template.content as any)?.metadata?.category || 'General Agreement';

  return {
    name: template.name,
    category,
  };
}

/**
 * Generates AI prompt for document creation
 */
function buildDocumentPrompt(
  templateName: string,
  templateCategory: string,
  participants: string[],
  finalPositions: Record<string, unknown>,
  summary: string[]
): string {
  const participantList = participants.join(' and ');
  const positionsJson = JSON.stringify(finalPositions, null, 2);
  const summaryBullets = summary.map(item => `- ${item}`).join('\n');

  return `Generate a professional alignment agreement document.

Context:
- Template type: ${templateName}
- Category: ${templateCategory}
- Participants: ${participantList}
- Aligned positions:
${positionsJson}

Executive Summary Points:
${summaryBullets}

Create a well-structured HTML document with:
1. An executive summary section with 3-5 bullet points highlighting key agreements
2. Detailed terms organized by logical categories (e.g., Equity & Ownership, Decision Making, Operations, etc.)
3. Professional but readable language suitable for a legally-binding agreement
4. Include reasoning and context where helpful to clarify decisions
5. Use proper HTML semantic structure (article, section, h1, h2, h3, p, ul, li)

Format requirements:
- Use <article> as the root element
- Use <section> tags for major divisions
- Use <h2> for category headings and <h3> for subsections
- Use <p> for paragraphs and <ul>/<li> for lists
- Add appropriate class names for styling (use descriptive class names)
- Include a header with document title, participants, and date
- Do NOT include <html>, <head>, or <body> tags - just the article content

Document structure:
<article class="alignment-document">
  <header class="document-header">
    <h1>Alignment Agreement</h1>
    <div class="document-meta">
      <p>Between: ${participantList}</p>
      <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p>Subject: ${templateName}</p>
    </div>
  </header>

  <section class="executive-summary">
    <h2>Executive Summary</h2>
    <!-- 3-5 bullet points summarizing key agreements -->
  </section>

  <section class="detailed-terms">
    <h2>Detailed Terms</h2>
    <!-- Organized by categories with h3 subheadings -->
  </section>
</article>

Generate a complete, professional document now.`;
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = GenerateDocumentRequestSchema.parse(body);

    const { alignmentId, templateId, finalPositions, participants, summary } = validatedData;

    // 3. Validate user has access to this alignment
    await validateAlignmentAccess(supabase, alignmentId, user.id);

    // 4. Fetch template details for context
    const template = await getTemplateDetails(supabase, templateId);

    // 5. Log AI operation start
    telemetry.logAIOperation({
      event: 'ai.document.start',
      alignmentId,
      latencyMs: 0,
      model: AI_MODELS.SONNET,
      success: true,
      userId: user.id,
    });

    // 6. Build AI prompt
    const prompt = buildDocumentPrompt(
      template.name,
      template.category,
      participants,
      finalPositions,
      summary
    );

    // 7. Generate document with Claude (config from prompt system)
    const promptConfig = await getPrompt('generate-document');
    const result = await generateText({
      model: resolveModel(promptConfig.model) as any,
      prompt,
      temperature: promptConfig.temperature,
      maxOutputTokens: promptConfig.maxTokens,
    });

    const documentHtml = result.text;

    // 8. Parse document into sections
    const sections = parseDocumentSections(documentHtml);

    // 9. Log success
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.document.complete',
      alignmentId,
      latencyMs,
      model: AI_MODELS.SONNET,
      success: true,
      userId: user.id,
    });

    // 10. Return response
    const response: GenerateDocumentResponse = {
      data: {
        documentHtml,
        sections,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    // Log error with context
    logError(error, {
      route: '/api/alignment/generate-document',
      method: 'POST',
      latencyMs: timer.getLatency(),
    });

    // Log AI operation error if we have an alignmentId
    if (error instanceof ValidationError === false) {
      const bodyData = await request.json().catch(() => ({}));
      if (bodyData.alignmentId) {
        telemetry.logAIOperation({
          event: 'ai.document.error',
          alignmentId: bodyData.alignmentId,
          latencyMs: timer.getLatency(),
          model: AI_MODELS.SONNET,
          success: false,
          errorCode: (error as any).code || 'UNKNOWN',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Handle different error types
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError('Invalid request body', { errors: error.errors });
      return NextResponse.json(
        validationError.toJSON(),
        { status: validationError.statusCode }
      );
    }

    // Return generic error response
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(
      await errorResponse.json(),
      { status: errorResponse.status }
    );
  }
}

// ============================================================================
// HTTP Method Guards
// ============================================================================

/**
 * Handles unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'GET method not supported' } },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'PUT method not supported' } },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'DELETE method not supported' } },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'PATCH method not supported' } },
    { status: 405 }
  );
}
