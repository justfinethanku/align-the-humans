import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { logError } from '@/app/lib/errors';
import {
  fetchDashboardAlignments,
  type AlignmentWithStatus,
} from '@/app/lib/dashboard-data';

export type { AlignmentWithStatus } from '@/app/lib/dashboard-data';

export interface UseDashboardDataOptions {
  userId: string;
  initialData?: AlignmentWithStatus[];
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
 */
export function useDashboardData({
  userId,
  initialData,
}: UseDashboardDataOptions): UseDashboardDataReturn {
  const [alignments, setAlignments] = useState<AlignmentWithStatus[]>(
    initialData ?? []
  );
  const [loading, setLoading] = useState(initialData === undefined);
  const [error, setError] = useState<Error | null>(null);
  const alignmentsRef = useRef(alignments);

  useEffect(() => {
    alignmentsRef.current = alignments;
  }, [alignments]);

  const fetchAlignments = useCallback(async () => {
    try {
      if (alignmentsRef.current.length === 0) {
        setLoading(true);
      }
      setError(null);

      const supabase = createClient();
      const nextAlignments = await fetchDashboardAlignments(supabase, userId);
      setAlignments(nextAlignments);
    } catch (err) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      logError(wrappedError, { context: 'useDashboardData.fetchAlignments' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (initialData !== undefined) {
      return;
    }

    fetchAlignments();
  }, [fetchAlignments, initialData]);

  return {
    alignments,
    loading,
    error,
    refetch: fetchAlignments,
  };
}
