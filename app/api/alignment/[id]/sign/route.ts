/**
 * API Route: Sign Agreement
 * POST /api/alignment/[id]/sign
 *
 * Creates an idempotent digital signature against the frozen agreement
 * snapshot and completes the alignment only from the resolving state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient, requireAuth } from '@/app/lib/supabase-server';
import {
  assertReadyForDocument,
  completeAlignmentIfAllSigned,
  createSignature,
} from '@/app/lib/db-helpers';
import {
  getOrCreateFrozenAgreementSnapshot,
  legacySignatureRequiresReview,
} from '@/app/lib/agreement-snapshots';
import type { Database } from '@/app/lib/database.types';
import { PerformanceTimer } from '@/app/lib/telemetry';
import {
  createErrorResponse,
  ValidationError,
  logError
} from '@/app/lib/errors';
import { sendAlignmentCompleteEmail } from '@/app/lib/email-service';
import type { AlignmentStatus } from '@/app/lib/types';
import { z } from 'zod';
import { createHash } from 'crypto';

// ============================================================================
// Request/Response Schemas
// ============================================================================

const SignRequestSchema = z.object({
  round: z.number().int().positive(),
  reviewedSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

interface SignResponse {
  data: {
    signatureId: string;
    allSigned: boolean;
    alignmentStatus: AlignmentStatus;
    snapshotId: string;
    snapshotHash: string;
    idempotent: boolean;
  };
}

type SupabaseRouteClient = ReturnType<typeof createServerClient>;
type SignatureRow = Database['public']['Tables']['alignment_signatures']['Row'];

// ============================================================================
// Helper Functions
// ============================================================================

function generateSignature(userId: string, snapshotHash: string): string {
  return createHash('sha256')
    .update(`${userId}:${Date.now()}:${snapshotHash}`)
    .digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { code?: string }).code === '23505';
}

async function getExistingSignature(
  supabase: SupabaseRouteClient,
  alignmentId: string,
  userId: string,
  round: number
) {
  const { data, error } = await supabase
    .from('alignment_signatures')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function assertNoLegacySignature(
  supabase: SupabaseRouteClient,
  alignmentId: string,
  round: number
): Promise<void> {
  const { data, error } = await supabase
    .from('alignment_signatures')
    .select('id')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .is('agreement_snapshot_hash', null)
    .limit(1);

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    throw legacySignatureRequiresReview(alignmentId, round);
  }
}

async function completeIfReady(params: {
  supabase: SupabaseRouteClient;
  alignmentId: string;
  round: number;
  snapshotHash: string;
}): Promise<{ allSigned: boolean; didComplete: boolean; finalStatus: AlignmentStatus }> {
  const { supabase, alignmentId, round, snapshotHash } = params;
  const { data: completion, error } = await completeAlignmentIfAllSigned(supabase, {
    alignmentId,
    round,
    contentHash: snapshotHash,
  });

  if (error || !completion) {
    throw error || new Error('Signature completion check returned no result');
  }

  return {
    allSigned: completion.all_signed,
    didComplete: completion.did_complete,
    finalStatus: completion.alignment_status as AlignmentStatus,
  };
}

function sendCompletionEmails(params: {
  supabase: SupabaseRouteClient;
  alignmentId: string;
  alignmentTitle: string | null;
}): void {
  const { supabase, alignmentId, alignmentTitle } = params;

  (async () => {
    try {
      const adminClient = createAdminClient();
      const { data: participants } = await supabase
        .from('alignment_participants')
        .select('user_id')
        .eq('alignment_id', alignmentId);

      if (!participants) return;

      for (const participant of participants) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', participant.user_id)
          .single();

        const { data: authUser } = await adminClient.auth.admin.getUserById(participant.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const partner = participants.find((candidate) => candidate.user_id !== participant.user_id);
        const { data: partnerProfile } = partner
          ? await supabase.from('profiles').select('display_name').eq('id', partner.user_id).single()
          : { data: null };

        await sendAlignmentCompleteEmail({
          to: email,
          recipientName: profile?.display_name || 'there',
          partnerName: partnerProfile?.display_name || 'Your partner',
          alignmentTitle: alignmentTitle || 'your alignment',
          alignmentId,
        });
      }
    } catch (emailErr) {
      console.error('[Email] Failed to send completion emails:', emailErr);
    }
  })();
}

function responseForSignature(params: {
  signature: SignatureRow;
  allSigned: boolean;
  finalStatus: AlignmentStatus;
  snapshotId: string;
  snapshotHash: string;
  idempotent: boolean;
}): SignResponse {
  const { signature, allSigned, finalStatus, snapshotId, snapshotHash, idempotent } = params;
  return {
    data: {
      signatureId: signature.id,
      allSigned,
      alignmentStatus: finalStatus,
      snapshotId,
      snapshotHash,
      idempotent,
    },
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const timer = new PerformanceTimer();
  const { id: alignmentId } = await params;
  const supabase = createServerClient();

  try {
    const user = await requireAuth(supabase);
    const body = await request.json();
    const { round, reviewedSnapshotHash } = SignRequestSchema.parse(body);
    const readiness = await assertReadyForDocument(supabase, alignmentId, user.id, round);

    await assertNoLegacySignature(supabase, alignmentId, round);

    const existingSignature = await getExistingSignature(supabase, alignmentId, user.id, round);
    if (existingSignature) {
      if (!existingSignature.agreement_snapshot_id || !existingSignature.agreement_snapshot_hash) {
        throw legacySignatureRequiresReview(alignmentId, round);
      }

      const { allSigned, didComplete, finalStatus } = await completeIfReady({
        supabase,
        alignmentId,
        round,
        snapshotHash: existingSignature.agreement_snapshot_hash,
      });

      if (didComplete) {
        sendCompletionEmails({
          supabase,
          alignmentId,
          alignmentTitle: readiness.alignment.title,
        });
      }

      return NextResponse.json(responseForSignature({
        signature: existingSignature,
        allSigned,
        finalStatus,
        snapshotId: existingSignature.agreement_snapshot_id,
        snapshotHash: existingSignature.agreement_snapshot_hash,
        idempotent: true,
      }), { status: 200 });
    }

    const snapshot = await getOrCreateFrozenAgreementSnapshot({
      supabase,
      alignmentId,
      round,
      userId: user.id,
      reviewedSnapshotHash,
    });

    if (!snapshot.id) {
      throw new Error('Frozen agreement snapshot did not return an id');
    }

    const signature = generateSignature(user.id, snapshot.hash);
    const { data: signatureRecord, error: signatureError } = await createSignature(
      supabase,
      {
        alignmentId,
        userId: user.id,
        round,
        canonicalSnapshot: snapshot.snapshot as any,
        signature,
        agreementSnapshotId: snapshot.id,
        agreementSnapshotHash: snapshot.hash,
      }
    );

    let finalSignature = signatureRecord;
    let idempotent = false;

    if (signatureError || !signatureRecord) {
      if (!isUniqueViolation(signatureError)) {
        throw signatureError || new Error('Failed to create signature');
      }

      const existingAfterRace = await getExistingSignature(supabase, alignmentId, user.id, round);
      if (!existingAfterRace?.agreement_snapshot_id || !existingAfterRace.agreement_snapshot_hash) {
        throw legacySignatureRequiresReview(alignmentId, round);
      }

      finalSignature = existingAfterRace;
      idempotent = true;
    }

    if (!finalSignature) {
      throw new Error('Failed to create signature');
    }

    const snapshotHash = finalSignature.agreement_snapshot_hash ?? snapshot.hash;
    const snapshotId = finalSignature.agreement_snapshot_id ?? snapshot.id;
    const { allSigned, didComplete, finalStatus } = await completeIfReady({
      supabase,
      alignmentId,
      round,
      snapshotHash,
    });

    if (didComplete) {
      sendCompletionEmails({
        supabase,
        alignmentId,
        alignmentTitle: readiness.alignment.title,
      });
    }

    const latencyMs = timer.stop();
    console.log('Signature recorded:', {
      alignmentId,
      userId: user.id,
      round,
      allSigned,
      snapshotHash,
      idempotent,
      latencyMs,
    });

    return NextResponse.json(responseForSignature({
      signature: finalSignature,
      allSigned,
      finalStatus,
      snapshotId,
      snapshotHash,
      idempotent,
    }), { status: 200 });

  } catch (error) {
    logError(error, {
      route: `/api/alignment/${alignmentId}/sign`,
      method: 'POST',
      latencyMs: timer.getLatency(),
    });

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
