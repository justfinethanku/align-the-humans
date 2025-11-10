/**
 * Database helper functions for common operations
 * Provides type-safe wrappers around Supabase queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type {
  Alignment,
  AlignmentParticipant,
  AlignmentResponse,
  AlignmentAnalysis,
  AlignmentDetail,
  QueryResult,
} from './types';

type SupabaseClientType = SupabaseClient<Database>;

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Gets a user's profile by ID
 */
export async function getProfile(
  supabase: SupabaseClientType,
  userId: string
): Promise<QueryResult<Database['public']['Tables']['profiles']['Row']>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

/**
 * Creates or updates a user profile
 */
export async function upsertProfile(
  supabase: SupabaseClientType,
  userId: string,
  displayName: string
): Promise<QueryResult<Database['public']['Tables']['profiles']['Row']>> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: displayName,
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// Alignment Operations
// ============================================================================

/**
 * Gets all alignments for a user
 */
export async function getUserAlignments(
  supabase: SupabaseClientType,
  userId: string
): Promise<QueryResult<Alignment[]>> {
  const { data, error } = await supabase
    .from('alignments')
    .select(
      `
      *,
      alignment_participants!inner(user_id)
    `
    )
    .eq('alignment_participants.user_id', userId)
    .order('updated_at', { ascending: false });

  return { data: data as Alignment[] | null, error };
}

/**
 * Gets a single alignment with full details
 */
export async function getAlignmentDetail(
  supabase: SupabaseClientType,
  alignmentId: string,
  userId: string
): Promise<QueryResult<AlignmentDetail>> {
  // First, verify user is a participant
  const { data: participant } = await supabase
    .from('alignment_participants')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .single();

  if (!participant) {
    return {
      data: null,
      error: new Error('Not authorized to view this alignment'),
    };
  }

  // Get alignment with participants
  const { data: alignment, error: alignmentError } = await supabase
    .from('alignments')
    .select(
      `
      *,
      participants:alignment_participants(*)
    `
    )
    .eq('id', alignmentId)
    .single();

  if (alignmentError || !alignment) {
    return { data: null, error: alignmentError };
  }

  // Get latest analysis
  const { data: latestAnalysis } = await supabase
    .from('alignment_analyses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .order('round', { ascending: false })
    .limit(1)
    .single();

  // Get user's response
  const { data: userResponse } = await supabase
    .from('alignment_responses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .eq('round', alignment.current_round)
    .single();

  // Get partner's response (if both submitted)
  const { data: partnerResponse } = await supabase
    .from('alignment_responses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .neq('user_id', userId)
    .eq('round', alignment.current_round)
    .not('submitted_at', 'is', null)
    .single();

  // Get signatures
  const { data: signatures } = await supabase
    .from('alignment_signatures')
    .select('*')
    .eq('alignment_id', alignmentId);

  return {
    data: {
      ...alignment,
      latest_analysis: latestAnalysis || undefined,
      user_response: userResponse || undefined,
      partner_response: partnerResponse || undefined,
      signatures: signatures || undefined,
    } as AlignmentDetail,
    error: null,
  };
}

/**
 * Creates a new alignment
 */
export async function createAlignment(
  supabase: SupabaseClientType,
  data: {
    partnerId: string;
    title: string;
    createdBy: string;
  }
): Promise<QueryResult<Alignment>> {
  const { data: alignment, error } = await supabase
    .from('alignments')
    .insert({
      partner_id: data.partnerId,
      title: data.title,
      status: 'draft',
      created_by: data.createdBy,
    })
    .select()
    .single();

  return { data: alignment as Alignment | null, error };
}

/**
 * Updates alignment status
 */
export async function updateAlignmentStatus(
  supabase: SupabaseClientType,
  alignmentId: string,
  status: Alignment['status']
): Promise<QueryResult<Alignment>> {
  const { data, error} = await supabase
    .from('alignments')
    .update({ status })
    .eq('id', alignmentId)
    .select()
    .single();

  return { data: data as Alignment | null, error };
}

/**
 * Updates alignment fields (title, etc.)
 */
export async function updateAlignment(
  supabase: SupabaseClientType,
  alignmentId: string,
  updates: Partial<Pick<Alignment, 'title' | 'status' | 'current_round'>>
): Promise<QueryResult<Alignment>> {
  const { data, error } = await supabase
    .from('alignments')
    .update(updates)
    .eq('id', alignmentId)
    .select()
    .single();

  return { data: data as Alignment | null, error };
}

// ============================================================================
// Participant Operations
// ============================================================================

/**
 * Adds a participant to an alignment
 */
export async function addParticipant(
  supabase: SupabaseClientType,
  data: {
    alignmentId: string;
    userId: string;
    role: AlignmentParticipant['role'];
  }
): Promise<QueryResult<AlignmentParticipant>> {
  const { data: participant, error } = await supabase
    .from('alignment_participants')
    .insert({
      alignment_id: data.alignmentId,
      user_id: data.userId,
      role: data.role,
    })
    .select()
    .single();

  return { data: participant as AlignmentParticipant | null, error };
}

/**
 * Checks if user is a participant in alignment
 */
export async function isParticipant(
  supabase: SupabaseClientType,
  alignmentId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('alignment_participants')
    .select('id')
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

// ============================================================================
// Response Operations
// ============================================================================

/**
 * Saves a user's response (upsert)
 */
export async function saveResponse(
  supabase: SupabaseClientType,
  data: {
    alignmentId: string;
    userId: string;
    round: number;
    answers: Database['public']['Tables']['alignment_responses']['Row']['answers'];
    metadata?: Database['public']['Tables']['alignment_responses']['Row']['metadata'];
  }
): Promise<QueryResult<AlignmentResponse>> {
  const { data: response, error } = await supabase
    .from('alignment_responses')
    .upsert(
      {
        alignment_id: data.alignmentId,
        user_id: data.userId,
        round: data.round,
        answers: data.answers,
        metadata: data.metadata || null,
      },
      {
        onConflict: 'alignment_id,user_id,round',
      }
    )
    .select()
    .single();

  return { data: response as AlignmentResponse | null, error };
}

/**
 * Submits a user's response (marks as submitted)
 */
export async function submitResponse(
  supabase: SupabaseClientType,
  alignmentId: string,
  userId: string,
  round: number
): Promise<QueryResult<AlignmentResponse>> {
  const { data, error } = await supabase
    .from('alignment_responses')
    .update({ submitted_at: new Date().toISOString() })
    .eq('alignment_id', alignmentId)
    .eq('user_id', userId)
    .eq('round', round)
    .select()
    .single();

  return { data: data as AlignmentResponse | null, error };
}

/**
 * Gets both participants' responses for a round (if both submitted)
 */
export async function getRoundResponses(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<QueryResult<AlignmentResponse[]>> {
  const { data, error } = await supabase
    .from('alignment_responses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .not('submitted_at', 'is', null);

  return { data: data as AlignmentResponse[] | null, error };
}

// ============================================================================
// Analysis Operations
// ============================================================================

/**
 * Saves AI analysis for a round
 */
export async function saveAnalysis(
  supabase: SupabaseClientType,
  data: {
    alignmentId: string;
    round: number;
    summary: Database['public']['Tables']['alignment_analyses']['Row']['summary'];
    details: Database['public']['Tables']['alignment_analyses']['Row']['details'];
    createdBy?: string;
  }
): Promise<QueryResult<AlignmentAnalysis>> {
  const { data: analysis, error } = await supabase
    .from('alignment_analyses')
    .insert({
      alignment_id: data.alignmentId,
      round: data.round,
      summary: data.summary,
      details: data.details,
      created_by: data.createdBy || null,
    })
    .select()
    .single();

  return { data: analysis as AlignmentAnalysis | null, error };
}

/**
 * Gets analysis for a specific round
 */
export async function getAnalysis(
  supabase: SupabaseClientType,
  alignmentId: string,
  round: number
): Promise<QueryResult<AlignmentAnalysis>> {
  const { data, error } = await supabase
    .from('alignment_analyses')
    .select('*')
    .eq('alignment_id', alignmentId)
    .eq('round', round)
    .single();

  return { data: data as AlignmentAnalysis | null, error };
}

// ============================================================================
// Template Operations
// ============================================================================

/**
 * Gets all available templates
 */
export async function getTemplates(
  supabase: SupabaseClientType
): Promise<QueryResult<Database['public']['Tables']['templates']['Row'][]>> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('name', { ascending: true });

  return { data, error };
}

/**
 * Gets a specific template by ID
 */
export async function getTemplate(
  supabase: SupabaseClientType,
  templateId: string
): Promise<QueryResult<Database['public']['Tables']['templates']['Row']>> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  return { data, error };
}

// ============================================================================
// Signature Operations
// ============================================================================

/**
 * Creates a signature for an alignment
 */
export async function createSignature(
  supabase: SupabaseClientType,
  data: {
    alignmentId: string;
    userId: string;
    round: number;
    canonicalSnapshot: Database['public']['Tables']['alignment_signatures']['Row']['canonical_snapshot'];
    signature: string;
  }
): Promise<QueryResult<Database['public']['Tables']['alignment_signatures']['Row']>> {
  const { data: sig, error } = await supabase
    .from('alignment_signatures')
    .insert({
      alignment_id: data.alignmentId,
      user_id: data.userId,
      round: data.round,
      canonical_snapshot: data.canonicalSnapshot,
      signature: data.signature,
    })
    .select()
    .single();

  return { data: sig, error };
}

/**
 * Gets all signatures for an alignment
 */
export async function getSignatures(
  supabase: SupabaseClientType,
  alignmentId: string
): Promise<QueryResult<Database['public']['Tables']['alignment_signatures']['Row'][]>> {
  const { data, error } = await supabase
    .from('alignment_signatures')
    .select('*')
    .eq('alignment_id', alignmentId)
    .order('created_at', { ascending: true });

  return { data, error };
}
