/**
 * API Route: Sign Agreement
 * POST /api/alignment/[id]/sign
 *
 * Creates a digital signature for an alignment agreement and updates status when both parties sign.
 *
 * Reference: plan_a.md lines 961-1008, 1024-1045
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/app/lib/supabase-server';
import { createSignature, updateAlignmentStatus, getSignatures } from '@/app/lib/db-helpers';
import { telemetry, PerformanceTimer } from '@/app/lib/telemetry';
import {
  createErrorResponse,
  ValidationError,
  AlignmentError,
  logError
} from '@/app/lib/errors';
import { z } from 'zod';
import { createHash } from 'crypto';

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Request body validation schema
 */
const SignRequestSchema = z.object({
  round: z.number().int().positive(),
});

type SignRequest = z.infer<typeof SignRequestSchema>;

/**
 * Response body structure
 */
interface SignResponse {
  data: {
    signatureId: string;
    allSigned: boolean;
    alignmentStatus: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates user has access to alignment and it's in correct status
 */
async function validateSignatureEligibility(
  supabase: ReturnType<typeof createServerClient>,
  alignmentId: string,
  userId: string
): Promise<{ alignment: any; participant: any }> {
  // Check user is a participant
  const { data: participant, error: participantError } = await supabase
    .from('alignment_participants')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .single();

  if (participantError || !participant) {
    throw AlignmentError.unauthorized(alignmentId, userId);
  }

  // Get alignment details
  const { data: alignment, error: alignmentError } = await supabase
    .from('alignments')
    .select('*')
    .eq('id', alignmentId)
    .single();

  if (alignmentError || !alignment) {
    throw new ValidationError('Alignment not found', { alignmentId });
  }

  // Verify alignment is in resolving or complete status (can re-sign in complete)
  if (alignment.status !== 'resolving' && alignment.status !== 'complete') {
    throw new ValidationError(
      'Alignment must be in resolving status to sign',
      { status: alignment.status }
    );
  }

  return { alignment, participant };
}

/**
 * Checks if user has already signed
 */
async function checkExistingSignature(
  supabase: ReturnType<typeof createServerClient>,
  alignmentId: string,
  userId: string,
  round: number
): Promise<boolean> {
  const { data } = await supabase
    .from('alignment_signatures')
    .select('id')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .eq('round', round)
    .single();

  return !!data;
}

/**
 * Generates canonical snapshot of agreement content
 */
async function generateCanonicalSnapshot(
  supabase: ReturnType<typeof createServerClient>,
  alignmentId: string,
  round: number,
  templateId?: string | null
): Promise<any> {
  // Get alignment responses
  const { data: responses } = await supabase
    .from('alignment_responses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .not('submitted_at', 'is', null);

  // Get analysis
  const { data: analysis } = await supabase
    .from('alignment_analyses')
    .select('summary')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .single();

  // Build canonical snapshot
  let questions: any[] = [];
  if (templateId) {
    const { data: template } = await supabase
      .from('templates')
      .select('content')
      .eq('id', templateId)
      .single();

    questions = ((template?.content as any)?.questions || []) as any[];
  }

  const snapshot = {
    alignment_id: alignmentId,
    round,
    questions,
    responses: responses?.reduce((acc, r) => {
      acc[r.user_id] = r.answers;
      return acc;
    }, {} as Record<string, any>) || {},
    analysis: analysis?.summary || {},
    timestamp: new Date().toISOString(),
    hash: '', // Will be computed below
  };

  // Generate hash of snapshot content
  const hash = createHash('sha256')
    .update(JSON.stringify(snapshot))
    .digest('hex');

  snapshot.hash = hash;

  return snapshot;
}

/**
 * Generates digital signature (hash of user ID + timestamp + snapshot hash)
 */
function generateSignature(userId: string, snapshotHash: string): string {
  const timestamp = Date.now().toString();
  return createHash('sha256')
    .update(`${userId}:${timestamp}:${snapshotHash}`)
    .digest('hex');
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const supabase = createServerClient();
  const alignmentId = params.id;

  try {
    // 1. Authenticate user
    const user = await requireAuth(supabase);

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = SignRequestSchema.parse(body);
    const { round } = validatedData;

    // 3. Validate eligibility to sign
    const { alignment, participant } = await validateSignatureEligibility(
      supabase,
      alignmentId,
      user.id
    );

    if (round !== alignment.current_round) {
      throw new ValidationError(
        `Round mismatch. Current round is ${alignment.current_round}, but attempted to sign round ${round}.`,
        { currentRound: alignment.current_round, requestedRound: round }
      );
    }

    // 4. Check if user already signed
    const alreadySigned = await checkExistingSignature(
      supabase,
      alignmentId,
      user.id,
      round
    );

    if (alreadySigned) {
      throw new ValidationError('You have already signed this agreement', {
        alignmentId,
        userId: user.id,
        round
      });
    }

    // 5. Generate canonical snapshot
    const canonicalSnapshot = await generateCanonicalSnapshot(
      supabase,
      alignmentId,
      round,
      alignment.template_id
    );

    // 6. Generate signature
    const signature = generateSignature(user.id, canonicalSnapshot.hash);

    // 7. Create signature record
    const { data: signatureRecord, error: signatureError } = await createSignature(
      supabase,
      {
        alignmentId,
        userId: user.id,
        round,
        canonicalSnapshot,
        signature
      }
    );

    if (signatureError || !signatureRecord) {
      throw new Error('Failed to create signature');
    }

    // 8. Check if all participants have signed
    const { data: allSignatures } = await getSignatures(supabase, alignmentId);
    const { data: allParticipants } = await supabase
      .from('alignment_participants')
      .select('user_id')
      .eq('alignment_id', alignmentId);

    const participantIds = new Set(allParticipants?.map(p => p.user_id) || []);
    const signedUserIds = new Set(
      allSignatures?.filter(s => s.round === round).map(s => s.user_id) || []
    );

    const allSigned = participantIds.size > 0 &&
      participantIds.size === signedUserIds.size &&
      Array.from(participantIds).every(id => signedUserIds.has(id));

    // 9. Update alignment status to complete if all signed
    let finalStatus = alignment.status;
    if (allSigned && alignment.status === 'resolving') {
      const { error: statusError } = await updateAlignmentStatus(
        supabase,
        alignmentId,
        'complete'
      );

      if (!statusError) {
        finalStatus = 'complete';
      }
    }

    // 10. Log success
    const latencyMs = timer.stop();
    // Note: Using generic ai.operation event type since signature.created isn't in TelemetryEventType
    console.log('Signature created:', {
      alignmentId,
      userId: user.id,
      round,
      allSigned,
      latencyMs
    });

    // 11. Return response
    const response: SignResponse = {
      data: {
        signatureId: signatureRecord.id,
        allSigned,
        alignmentStatus: finalStatus
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    // Log error with context
    logError(error, {
      route: `/api/alignment/${alignmentId}/sign`,
      method: 'POST',
      latencyMs: timer.getLatency(),
    });

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
