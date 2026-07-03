import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { logError } from '@/app/lib/errors';
import {
  fetchDashboardPartners,
  type PartnerWithCount,
} from '@/app/lib/dashboard-data';

export type { PartnerWithCount } from '@/app/lib/dashboard-data';

export interface UsePartnersOptions {
  userId: string;
  initialData?: PartnerWithCount[];
}

/**
 * Hook return type
 */
export interface UsePartnersReturn {
  partners: PartnerWithCount[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches user's partners with alignment counts and profile data
 *
 * Implementation strategy:
 * 1. Find all alignments where current user is a participant
 * 2. Find other participants in those alignments
 * 3. Group by unique user IDs and count shared alignments
 * 4. Fetch profile data for each partner user
 * 5. Map back to partner records with full details
 */
export function usePartners({
  userId,
  initialData,
}: UsePartnersOptions): UsePartnersReturn {
  const [partners, setPartners] = useState<PartnerWithCount[]>(initialData ?? []);
  const [loading, setLoading] = useState(initialData === undefined);
  const [error, setError] = useState<Error | null>(null);
  const partnersRef = useRef(partners);

  useEffect(() => {
    partnersRef.current = partners;
  }, [partners]);

  const fetchPartners = useCallback(async () => {
    try {
      if (partnersRef.current.length === 0) {
        setLoading(true);
      }
      setError(null);

      const supabase = createClient();
      const nextPartners = await fetchDashboardPartners(supabase, userId);
      setPartners(nextPartners);
    } catch (err) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      logError(wrappedError, { context: 'usePartners.fetchPartners' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (initialData !== undefined) {
      return;
    }

    fetchPartners();
  }, [fetchPartners, initialData]);

  return {
    partners,
    loading,
    error,
    refetch: fetchPartners,
  };
}
