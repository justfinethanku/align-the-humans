/**
 * React hook for real-time alignment updates
 * Subscribes to alignment changes via Supabase Realtime
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 *
 * import { useAlignmentUpdates } from '@/app/lib/hooks/useAlignmentUpdates';
 *
 * export function DashboardPage() {
 *   const { connected, error } = useAlignmentUpdates({
 *     onUpdate: (alignment) => {
 *       console.log('Alignment updated:', alignment);
 *       // Refresh dashboard data...
 *     },
 *   });
 * }
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { logError } from '@/app/lib/errors';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/database.types';
import type { RealtimeEvent } from '@/app/lib/types';

/**
 * Alignment row type
 */
type AlignmentRow = Database['public']['Tables']['alignments']['Row'];

/**
 * Participant row type
 */
type ParticipantRow = Database['public']['Tables']['alignment_participants']['Row'];

/**
 * Hook options
 */
export interface UseAlignmentUpdatesOptions {
  /**
   * Callback when alignment is inserted
   */
  onInsert?: (alignment: AlignmentRow) => void;

  /**
   * Callback when alignment is updated
   */
  onUpdate?: (alignment: AlignmentRow) => void;

  /**
   * Callback when alignment is deleted
   */
  onDelete?: (alignment: AlignmentRow) => void;

  /**
   * Callback when a new partner joins the alignment
   */
  onPartnerJoin?: (participant: ParticipantRow) => void;

  /**
   * Optional alignment ID to subscribe to specific alignment
   * If not provided, subscribes to all user's alignments
   */
  alignmentId?: string;

  /**
   * Whether to enable the subscription (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseAlignmentUpdatesReturn {
  connected: boolean;
  error: Error | null;
  disconnect: () => void;
}

/**
 * Subscribes to real-time alignment updates
 * Uses Supabase Realtime to listen for changes to alignments table
 */
export function useAlignmentUpdates(
  options: UseAlignmentUpdatesOptions = {}
): UseAlignmentUpdatesReturn {
  const {
    onInsert,
    onUpdate,
    onDelete,
    onPartnerJoin,
    alignmentId,
    enabled = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    let mounted = true;

    const subscribe = async () => {
      try {
        setError(null);

        const supabase = supabaseRef.current;

        // Get current user for RLS filtering
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error('No authenticated user');
        }

        // Get user's session token for Realtime auth
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          // Set auth token for Realtime connection
          await supabase.realtime.setAuth(token);
        }

        // Prevent duplicate subscriptions
        if (channelRef.current) {
          disconnect();
        }

        // Create channel name
        const channelName = alignmentId
          ? `alignment:${alignmentId}:updates`
          : `user:${user.id}:alignments`;

        // Subscribe to alignments table changes
        const channel = supabase
          .channel(channelName, {
            config: {
              private: true,
              broadcast: { ack: true, self: true }
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'alignments',
              filter: alignmentId ? `id=eq.${alignmentId}` : undefined,
            },
            (payload) => {
              if (!mounted) return;
              const newRecord = payload.new as AlignmentRow;
              onInsert?.(newRecord);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'alignments',
              filter: alignmentId ? `id=eq.${alignmentId}` : undefined,
            },
            (payload) => {
              if (!mounted) return;
              const updatedRecord = payload.new as AlignmentRow;
              onUpdate?.(updatedRecord);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'alignments',
              filter: alignmentId ? `id=eq.${alignmentId}` : undefined,
            },
            (payload) => {
              if (!mounted) return;
              const deletedRecord = payload.old as AlignmentRow;
              onDelete?.(deletedRecord);
            }
          );

        // Subscribe to alignment_participants table changes (for partner join notifications)
        if (alignmentId && onPartnerJoin) {
          channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'alignment_participants',
              filter: `alignment_id=eq.${alignmentId}`,
            },
            (payload) => {
              if (!mounted) return;
              const newParticipant = payload.new as ParticipantRow;

              // Only trigger callback for partner role (not owner)
              if (newParticipant.role === 'partner') {
                onPartnerJoin(newParticipant);
              }
            }
          );
        }

        channel.subscribe((status) => {
          if (!mounted) return;

          if (status === 'SUBSCRIBED') {
            setConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setError(new Error('Failed to subscribe to alignment updates'));
            setConnected(false);
          } else if (status === 'TIMED_OUT') {
            setError(new Error('Subscription timed out'));
            setConnected(false);
          }
        });

        channelRef.current = channel;
      } catch (err) {
        if (!mounted) return;
        const wrappedError = err instanceof Error ? err : new Error(String(err));
        setError(wrappedError);
        setConnected(false);
        logError(wrappedError, {
          context: 'useAlignmentUpdates.subscribe',
          alignmentId
        });
      }
    };

    subscribe();

    // Cleanup on unmount or when dependencies change
    return () => {
      mounted = false;
      disconnect();
    };
  }, [enabled, alignmentId, onInsert, onUpdate, onDelete, onPartnerJoin, disconnect]);

  return {
    connected,
    error,
    disconnect,
  };
}
