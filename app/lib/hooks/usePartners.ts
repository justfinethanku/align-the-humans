/**
 * React hook for fetching user's partners with profile information
 *
 * Partners are identified by finding other users in the same alignments
 * as the current user. Each partner includes:
 * - Profile data (display_name, avatar, etc.)
 * - Alignment count (number of shared alignments)
 * - Partner record metadata
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 *
 * import { usePartners } from '@/app/lib/hooks/usePartners';
 *
 * export function PartnersPage() {
 *   const { partners, loading, error, refetch } = usePartners();
 *
 *   partners.forEach(partner => {
 *     console.log(partner.profile?.display_name); // Partner's display name
 *     console.log(partner.alignment_count);       // Number of shared alignments
 *   });
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { DatabaseError, logError } from '@/app/lib/errors';
import type { Database } from '@/app/lib/database.types';

/**
 * Partner with alignment count and profile information
 */
export interface PartnerWithCount {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  alignment_count: number;
  partner_user_id: string;  // The actual partner user ID
  profile: {
    id: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
  } | null;
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
export function usePartners(): UsePartnersReturn {
  const [partners, setPartners] = useState<PartnerWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPartners = useCallback(async () => {
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

      // Strategy: Find unique partner users through alignment_participants
      // 1. Get all alignments where current user is a participant
      const { data: myParticipations, error: participationsError } = await supabase
        .from('alignment_participants')
        .select('alignment_id')
        .eq('user_id', user.id);

      if (participationsError) {
        throw new DatabaseError('Failed to fetch user participations', {
          cause: participationsError,
          details: { userId: user.id }
        });
      }

      if (!myParticipations || myParticipations.length === 0) {
        // User has no alignments yet, so no partners
        setPartners([]);
        return;
      }

      const alignmentIds = myParticipations.map(p => p.alignment_id);

      // 2. Get all participants in those alignments (excluding current user)
      const { data: otherParticipants, error: otherParticipantsError } = await supabase
        .from('alignment_participants')
        .select('user_id, alignment_id')
        .in('alignment_id', alignmentIds)
        .neq('user_id', user.id);

      if (otherParticipantsError) {
        throw new DatabaseError('Failed to fetch other participants', {
          cause: otherParticipantsError,
          details: { userId: user.id }
        });
      }

      if (!otherParticipants || otherParticipants.length === 0) {
        // User is in alignments but has no partners (shouldn't happen normally)
        setPartners([]);
        return;
      }

      // 3. Group by unique partner user IDs and count their alignments
      const partnerMap = new Map<string, { user_id: string; alignment_count: number; alignment_ids: string[] }>();

      otherParticipants.forEach(participant => {
        const existing = partnerMap.get(participant.user_id);
        if (existing) {
          existing.alignment_count++;
          existing.alignment_ids.push(participant.alignment_id);
        } else {
          partnerMap.set(participant.user_id, {
            user_id: participant.user_id,
            alignment_count: 1,
            alignment_ids: [participant.alignment_id]
          });
        }
      });

      // 4. Fetch profiles for all partner users
      const partnerUserIds = Array.from(partnerMap.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, updated_at')
        .in('id', partnerUserIds);

      if (profilesError) {
        throw new DatabaseError('Failed to fetch partner profiles', {
          cause: profilesError,
          details: { userId: user.id, partnerUserIds }
        });
      }

      // 5. Fetch the actual partner records (for metadata like created_at)
      // Get alignments with their partner_id to map back
      const { data: alignmentsData, error: alignmentsError } = await supabase
        .from('alignments')
        .select('id, partner_id, created_at, updated_at, created_by')
        .in('id', alignmentIds);

      if (alignmentsError) {
        throw new DatabaseError('Failed to fetch alignments', {
          cause: alignmentsError,
          details: { userId: user.id }
        });
      }

      // 6. Get unique partner records
      const uniquePartnerIds = new Set(alignmentsData?.map(a => a.partner_id) || []);
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .in('id', Array.from(uniquePartnerIds));

      if (partnersError) {
        throw new DatabaseError('Failed to fetch partner records', {
          cause: partnersError,
          details: { userId: user.id }
        });
      }

      // 7. Build final partner list with profiles and counts
      // Create a map of partner_id -> partner_user_id based on alignments
      const partnerIdToUserId = new Map<string, string>();
      alignmentsData?.forEach(alignment => {
        // Find the other participant in this alignment
        const otherParticipant = otherParticipants.find(p => p.alignment_id === alignment.id);
        if (otherParticipant) {
          partnerIdToUserId.set(alignment.partner_id, otherParticipant.user_id);
        }
      });

      // Build the final result
      const partnersWithDetails: PartnerWithCount[] = (partnersData || []).map(partner => {
        const partnerUserId = partnerIdToUserId.get(partner.id);
        const partnerInfo = partnerUserId ? partnerMap.get(partnerUserId) : null;
        const profile = profiles?.find(p => p.id === partnerUserId) || null;

        return {
          ...partner,
          alignment_count: partnerInfo?.alignment_count || 0,
          partner_user_id: partnerUserId || '',
          profile
        };
      }).filter(p => p.partner_user_id); // Remove any without a valid partner user

      // Sort by most recent activity (using updated_at as proxy)
      partnersWithDetails.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setPartners(partnersWithDetails);
    } catch (err) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      logError(wrappedError, { context: 'usePartners.fetchPartners' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    loading,
    error,
    refetch: fetchPartners,
  };
}
