/**
 * Drizzle-based database queries
 *
 * Type-safe query functions using Drizzle ORM.
 * These bypass RLS (direct PostgreSQL connection), so auth
 * must be checked at the route handler level before calling these.
 *
 * Usage:
 * ```ts
 * import { getProfileById, getUserAlignments } from '@/app/lib/db/queries';
 * const profile = await getProfileById(userId);
 * ```
 */

import { db } from './index';
import {
  profiles,
  partners,
  templates,
  alignments,
  alignmentParticipants,
  alignmentResponses,
  alignmentAnalyses,
  alignmentSignatures,
} from './schema';
import { eq, and, desc, asc, ne, isNotNull, sql } from 'drizzle-orm';
import { isValidStatusTransition, type AlignmentStatus } from '../types';

// ============================================================================
// Profile Operations
// ============================================================================

export async function getProfileById(userId: string) {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertProfileRecord(userId: string, displayName: string) {
  const result = await db
    .insert(profiles)
    .values({ id: userId, displayName })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { displayName },
    })
    .returning();
  return result[0] ?? null;
}

// ============================================================================
// Alignment Operations
// ============================================================================

export async function getAlignmentsByUserId(userId: string) {
  const participantRows = await db
    .select({ alignmentId: alignmentParticipants.alignmentId })
    .from(alignmentParticipants)
    .where(eq(alignmentParticipants.userId, userId));

  if (participantRows.length === 0) return [];

  const alignmentIds = participantRows.map(r => r.alignmentId);
  const result = await db
    .select()
    .from(alignments)
    .where(sql`${alignments.id} = ANY(${alignmentIds})`)
    .orderBy(desc(alignments.updatedAt));

  return result;
}

export async function getAlignmentById(alignmentId: string) {
  const result = await db
    .select()
    .from(alignments)
    .where(eq(alignments.id, alignmentId))
    .limit(1);
  return result[0] ?? null;
}

export async function getAlignmentWithParticipants(alignmentId: string) {
  const alignment = await getAlignmentById(alignmentId);
  if (!alignment) return null;

  const participants = await db
    .select()
    .from(alignmentParticipants)
    .where(eq(alignmentParticipants.alignmentId, alignmentId));

  return { ...alignment, participants };
}

export async function getAlignmentDetailForUser(alignmentId: string, userId: string) {
  // Verify user is a participant
  const participant = await db
    .select()
    .from(alignmentParticipants)
    .where(
      and(
        eq(alignmentParticipants.alignmentId, alignmentId),
        eq(alignmentParticipants.userId, userId)
      )
    )
    .limit(1);

  if (participant.length === 0) return null;

  const alignment = await getAlignmentWithParticipants(alignmentId);
  if (!alignment) return null;

  // Get latest analysis
  const latestAnalysis = await db
    .select()
    .from(alignmentAnalyses)
    .where(eq(alignmentAnalyses.alignmentId, alignmentId))
    .orderBy(desc(alignmentAnalyses.round))
    .limit(1);

  // Get user's response for current round
  const userResponse = await db
    .select()
    .from(alignmentResponses)
    .where(
      and(
        eq(alignmentResponses.alignmentId, alignmentId),
        eq(alignmentResponses.userId, userId),
        eq(alignmentResponses.round, alignment.currentRound)
      )
    )
    .limit(1);

  // Get partner's response (if submitted)
  const partnerResponse = await db
    .select()
    .from(alignmentResponses)
    .where(
      and(
        eq(alignmentResponses.alignmentId, alignmentId),
        ne(alignmentResponses.userId, userId),
        eq(alignmentResponses.round, alignment.currentRound),
        isNotNull(alignmentResponses.submittedAt)
      )
    )
    .limit(1);

  // Get signatures
  const sigs = await db
    .select()
    .from(alignmentSignatures)
    .where(eq(alignmentSignatures.alignmentId, alignmentId));

  return {
    ...alignment,
    latest_analysis: latestAnalysis[0] ?? undefined,
    user_response: userResponse[0] ?? undefined,
    partner_response: partnerResponse[0] ?? undefined,
    signatures: sigs.length > 0 ? sigs : undefined,
  };
}

export async function createAlignmentRecord(data: {
  partnerId?: string | null;
  title: string;
  createdBy: string;
}) {
  const result = await db
    .insert(alignments)
    .values({
      partnerId: data.partnerId ?? null,
      title: data.title,
      status: 'draft',
      createdBy: data.createdBy,
    })
    .returning();
  return result[0] ?? null;
}

export async function updateAlignmentStatusRecord(
  alignmentId: string,
  newStatus: AlignmentStatus
) {
  // Fetch current status
  const current = await db
    .select({ status: alignments.status })
    .from(alignments)
    .where(eq(alignments.id, alignmentId))
    .limit(1);

  if (current.length === 0) {
    throw new Error('Alignment not found');
  }

  const currentStatus = current[0].status as AlignmentStatus;
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`);
  }

  const result = await db
    .update(alignments)
    .set({ status: newStatus })
    .where(eq(alignments.id, alignmentId))
    .returning();
  return result[0] ?? null;
}

export async function updateAlignmentRecord(
  alignmentId: string,
  updates: Partial<{
    title: string | null;
    status: string;
    currentRound: number;
    clarityDraft: unknown;
  }>
) {
  // Validate status transition if status is being updated
  if (updates.status) {
    const current = await db
      .select({ status: alignments.status })
      .from(alignments)
      .where(eq(alignments.id, alignmentId))
      .limit(1);

    if (current.length === 0) {
      throw new Error('Alignment not found');
    }

    const currentStatus = current[0].status as AlignmentStatus;
    if (!isValidStatusTransition(currentStatus, updates.status as AlignmentStatus)) {
      throw new Error(`Invalid status transition: ${currentStatus} → ${updates.status}`);
    }
  }

  const result = await db
    .update(alignments)
    .set(updates)
    .where(eq(alignments.id, alignmentId))
    .returning();
  return result[0] ?? null;
}

// ============================================================================
// Participant Operations
// ============================================================================

export async function addParticipantRecord(data: {
  alignmentId: string;
  userId: string;
  role: string;
}) {
  const result = await db
    .insert(alignmentParticipants)
    .values({
      alignmentId: data.alignmentId,
      userId: data.userId,
      role: data.role,
    })
    .returning();
  return result[0] ?? null;
}

export async function checkIsParticipant(
  alignmentId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({ id: alignmentParticipants.id })
    .from(alignmentParticipants)
    .where(
      and(
        eq(alignmentParticipants.alignmentId, alignmentId),
        eq(alignmentParticipants.userId, userId)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function getParticipants(alignmentId: string) {
  return db
    .select()
    .from(alignmentParticipants)
    .where(eq(alignmentParticipants.alignmentId, alignmentId));
}

// ============================================================================
// Response Operations
// ============================================================================

export async function saveResponseRecord(data: {
  alignmentId: string;
  userId: string;
  round: number;
  answers: unknown;
  metadata?: unknown;
}) {
  const result = await db
    .insert(alignmentResponses)
    .values({
      alignmentId: data.alignmentId,
      userId: data.userId,
      round: data.round,
      answers: data.answers,
      metadata: data.metadata ?? null,
    })
    .onConflictDoUpdate({
      target: [
        alignmentResponses.alignmentId,
        alignmentResponses.userId,
        alignmentResponses.round,
      ],
      set: {
        answers: data.answers,
        metadata: data.metadata ?? null,
      },
    })
    .returning();
  return result[0] ?? null;
}

export async function submitResponseRecord(
  alignmentId: string,
  userId: string,
  round: number
) {
  const result = await db
    .update(alignmentResponses)
    .set({ submittedAt: new Date().toISOString() })
    .where(
      and(
        eq(alignmentResponses.alignmentId, alignmentId),
        eq(alignmentResponses.userId, userId),
        eq(alignmentResponses.round, round)
      )
    )
    .returning();
  return result[0] ?? null;
}

export async function getSubmittedRoundResponses(
  alignmentId: string,
  round: number
) {
  return db
    .select()
    .from(alignmentResponses)
    .where(
      and(
        eq(alignmentResponses.alignmentId, alignmentId),
        eq(alignmentResponses.round, round),
        isNotNull(alignmentResponses.submittedAt)
      )
    )
    .orderBy(asc(alignmentResponses.userId));
}

// ============================================================================
// Analysis Operations
// ============================================================================

export async function saveAnalysisRecord(data: {
  alignmentId: string;
  round: number;
  summary: unknown;
  details: unknown;
  createdBy?: string;
}) {
  const result = await db
    .insert(alignmentAnalyses)
    .values({
      alignmentId: data.alignmentId,
      round: data.round,
      summary: data.summary,
      details: data.details,
      createdBy: data.createdBy ?? null,
    })
    .returning();
  return result[0] ?? null;
}

export async function getAnalysisRecord(alignmentId: string, round: number) {
  const result = await db
    .select()
    .from(alignmentAnalyses)
    .where(
      and(
        eq(alignmentAnalyses.alignmentId, alignmentId),
        eq(alignmentAnalyses.round, round)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

// ============================================================================
// Template Operations
// ============================================================================

export async function getAllTemplates() {
  return db
    .select()
    .from(templates)
    .orderBy(asc(templates.name));
}

export async function getTemplateById(templateId: string) {
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
  return result[0] ?? null;
}

// ============================================================================
// Signature Operations
// ============================================================================

export async function createSignatureRecord(data: {
  alignmentId: string;
  userId: string;
  round: number;
  canonicalSnapshot: unknown;
  signature: string;
}) {
  const result = await db
    .insert(alignmentSignatures)
    .values({
      alignmentId: data.alignmentId,
      userId: data.userId,
      round: data.round,
      canonicalSnapshot: data.canonicalSnapshot,
      signature: data.signature,
    })
    .returning();
  return result[0] ?? null;
}

export async function getSignaturesByAlignment(alignmentId: string) {
  return db
    .select()
    .from(alignmentSignatures)
    .where(eq(alignmentSignatures.alignmentId, alignmentId))
    .orderBy(asc(alignmentSignatures.createdAt));
}
