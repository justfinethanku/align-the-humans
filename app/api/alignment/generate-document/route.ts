/**
 * API Route: Generate Final Alignment Document
 * POST /api/alignment/generate-document
 *
 * Returns the server-derived agreement document preview, or the frozen
 * per-round artifact if signing has already started.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import {
  createErrorResponse,
  ValidationError,
  RateLimitError,
  logError
} from '@/app/lib/errors';
import { checkRateLimit, rateLimitKeyForUser } from '@/app/lib/rate-limit';
import { assertReadyForDocument } from '@/app/lib/db-helpers';
import {
  buildAgreementSnapshotPreview,
  loadFrozenAgreementSnapshot,
} from '@/app/lib/agreement-snapshots';
import type { DocumentSection } from '@/app/lib/types';
import { z } from 'zod';

// ============================================================================
// Request/Response Schemas
// ============================================================================

const GenerateDocumentRequestSchema = z.object({
  alignmentId: z.string().uuid('Invalid alignment ID format'),
  round: z.number().int().positive().optional(),
}).strict();

interface GenerateDocumentResponse {
  data: {
    documentHtml: string;
    sections: DocumentSection[];
    snapshotHash: string;
    snapshotId: string | null;
    isFrozen: boolean;
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  let bodyData: unknown = {};

  try {
    const user = await requireAuth(supabase);

    const rateLimitResult = await checkRateLimit(
      rateLimitKeyForUser(user.id, 'alignment.generate-document'),
      { limit: 10, windowMs: 60_000 }
    );
    if (!rateLimitResult.ok) {
      throw new RateLimitError('Too many document generation requests. Please try again shortly.', {
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    bodyData = await request.json();
    const validatedData = GenerateDocumentRequestSchema.parse(bodyData);
    const { alignmentId, round: requestedRound } = validatedData;
    const readiness = await assertReadyForDocument(
      supabase,
      alignmentId,
      user.id,
      requestedRound
    );

    telemetry.logAIOperation({
      event: 'ai.document.start',
      alignmentId,
      latencyMs: 0,
      model: 'deterministic-template',
      success: true,
      userId: user.id,
    });

    const snapshot = await loadFrozenAgreementSnapshot(
      supabase,
      alignmentId,
      readiness.round
    ) ?? await buildAgreementSnapshotPreview(
      supabase,
      alignmentId,
      readiness.round
    );

    const latencyMs = timer.stop();
    telemetry.logAIOperation({
      event: 'ai.document.complete',
      alignmentId,
      latencyMs,
      model: 'deterministic-template',
      success: true,
      userId: user.id,
    });

    const response: GenerateDocumentResponse = {
      data: {
        documentHtml: snapshot.documentHtml,
        sections: snapshot.documentSections,
        snapshotHash: snapshot.hash,
        snapshotId: snapshot.id,
        isFrozen: snapshot.isFrozen,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logError(error, {
      route: '/api/alignment/generate-document',
      method: 'POST',
      latencyMs: timer.getLatency(),
    });

    if (!(error instanceof ValidationError)) {
      const alignmentId = bodyData && typeof bodyData === 'object'
        ? (bodyData as { alignmentId?: unknown }).alignmentId
        : null;

      if (typeof alignmentId === 'string') {
        telemetry.logAIOperation({
          event: 'ai.document.error',
          alignmentId,
          latencyMs: timer.getLatency(),
          model: 'deterministic-template',
          success: false,
          errorCode: (error as any).code || 'UNKNOWN',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (error instanceof z.ZodError) {
      const validationError = new ValidationError('Invalid request body', { errors: error.errors });
      return NextResponse.json(
        validationError.toJSON(),
        { status: validationError.statusCode }
      );
    }

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
