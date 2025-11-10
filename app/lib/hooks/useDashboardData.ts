/**
 * React hook for fetching dashboard data
 * Provides user's alignments with UI status from alignment_status_view
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 *
 * import { useDashboardData } from '@/app/lib/hooks/useDashboardData';
 *
 * export function DashboardPage() {
 *   const { alignments, loading, error, refetch } = useDashboardData();
 *   // Use data...
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { DatabaseError, logError } from '@/app/lib/errors';
import type { UIStatus } from '@/app/lib/types';

/**
 * Alignment with UI status from alignment_status_view
 */
export interface AlignmentWithStatus {
  id: string;
  partner_id: string;
  template_id: string | null;
  status: UIStatus | string;
  ui_status: UIStatus;
  current_round: number;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  submitted_responses?: number;
  signed_count?: number;
  participants: Array<{
    id: string;
    user_id: string;
    role: 'owner' | 'partner';
    created_at: string;
  }>;
}

/**
 * Hook return type
 */
export interface UseDashboardDataReturn {
  alignments: AlignmentWithStatus[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches user's alignments with participant info and UI status
 * Uses alignment_status_view for derived UI status labels
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [alignments, setAlignments] = useState<AlignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new DatabaseError('Failed to get user session', { cause: userError });
      }

      if (!user) {
        throw new DatabaseError('No authenticated user');
      }

      // First, get alignment IDs where user is a participant
      const { data: userParticipations, error: participationError } = await supabase
        .from('alignment_participants')
        .select('alignment_id')
        .eq('user_id', user.id);

      if (participationError) {
        throw new DatabaseError('Failed to fetch user participations', {
          cause: participationError,
          details: { userId: user.id }
        });
      }

      const alignmentIds = (userParticipations || []).map(p => p.alignment_id);

      // If no alignments, return empty array
      if (alignmentIds.length === 0) {
        setAlignments([]);
        return;
      }

      // Fetch alignments with derived status from view
      const { data: alignmentsData, error: queryError } = await supabase
        .from('alignment_status_view')
        .select(`
          *,
          participants:alignment_participants(
            id,
            user_id,
            role,
            created_at
          )
        `)
        .in('id', alignmentIds)
        .order('updated_at', { ascending: false });

      if (queryError) {
        throw new DatabaseError('Failed to fetch alignments with status', {
          cause: queryError,
          details: { userId: user.id }
        });
      }

      const alignmentsWithStatus = (alignmentsData || []).map((alignment) => ({
        ...alignment,
        ui_status: (alignment.ui_status as UIStatus) || (alignment.status as UIStatus),
      }));

      setAlignments(alignmentsWithStatus as AlignmentWithStatus[]);
    } catch (err) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      logError(wrappedError, { context: 'useDashboardData.fetchAlignments' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchAlignments();
  }, [fetchAlignments]);

  return {
    alignments,
    loading,
    error,
    refetch: fetchAlignments,
  };
}
