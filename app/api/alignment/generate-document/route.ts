/**
 * API Route: Generate Final Alignment Document
 * POST /api/alignment/generate-document
 *
 * Renders the final agreement document deterministically ("fill in the
 * blank"): a DB-managed HTML skeleton (prompt slug 'document-skeleton',
 * editable in the admin dashboard) is filled with the aligned positions,
 * executive summary, participants, and date. All interpolated content is
 * HTML-escaped; no AI call and no model-generated markup is involved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrompt, renderPrompt } from '@/app/lib/prompts';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import {
  createErrorResponse,
  ValidationError,
  AlignmentError,
  RateLimitError,
  logError
} from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
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
 * Escapes user-supplied text for safe interpolation into document HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Converts a snake_case/kebab-case position key into a readable heading. */
function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const MAX_POSITION_RENDER_DEPTH = 4;

function stringifyForDepthLimit(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

function renderPositionValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (depth >= MAX_POSITION_RENDER_DEPTH) {
    return escapeHtml(stringifyForDepthLimit(value));
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return escapeHtml(String(value));
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => renderPositionValue(item, depth + 1))
      .filter((item) => item.length > 0);

    return items.length > 0
      ? `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';
  }

  if (typeof value === 'object') {
    const items = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const renderedItem = renderPositionValue(item, depth + 1);
        if (!renderedItem) {
          return '';
        }
        return `<li><strong>${escapeHtml(humanizeKey(key))}:</strong> ${renderedItem}</li>`;
      })
      .filter((item) => item.length > 0);

    return items.length > 0 ? `<ul>${items.join('')}</ul>` : '';
  }

  return escapeHtml(String(value));
}

/** Renders one aligned-position value as escaped HTML. */
function renderPositionBody(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const renderedValue = renderPositionValue(value, 0);
  if (!renderedValue) {
    return '';
  }

  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? `<p>${renderedValue}</p>`
    : renderedValue;
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

    // 1b. Rate limit (heavy AI operation): ~10/min/user
    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.generate-document'),
      { limit: 10, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many document generation requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

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
      model: 'deterministic-template',
      success: true,
      userId: user.id,
    });

    // 6. Load the DB-managed document skeleton (editable in /admin/prompts)
    const skeleton = await getPrompt('document-skeleton');

    // 7. Fill in the blanks deterministically (all content HTML-escaped)
    const summaryItems = summary
      .map((item) => `        <li>${escapeHtml(item)}</li>`)
      .join('\n');
    const termsSections = Object.entries(finalPositions)
      .map(
        ([key, value]) =>
          `      <section class="term">\n        <h3>${escapeHtml(humanizeKey(key))}</h3>\n        ${renderPositionBody(value)}\n      </section>`
      )
      .join('\n');

    const documentHtml = renderPrompt(skeleton.userPromptTemplate, {
      participantList: participants.map((name) => escapeHtml(name)).join(' and '),
      documentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      templateName: escapeHtml(template.name),
      templateCategory: escapeHtml(template.category),
      summaryItems,
      termsSections,
    });

    // 8. Parse document into sections
    const sections = parseDocumentSections(documentHtml);

    // 9. Log success
    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.document.complete',
      alignmentId,
      latencyMs,
      model: 'deterministic-template',
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
          model: 'deterministic-template',
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
