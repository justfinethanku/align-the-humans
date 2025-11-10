'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/app/lib/supabase-browser';
import { ShareLinkButton } from './ShareLinkButton';

interface InviteStatusProps {
  alignmentId: string;
  showRegenerateButton?: boolean;
}

interface ParticipantInfo {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    display_name: string;
  };
}

export function InviteStatus({ alignmentId, showRegenerateButton = true }: InviteStatusProps) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchParticipants();
  }, [alignmentId]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('alignment_participants')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles:user_id (
            display_name
          )
        `)
        .eq('alignment_id', alignmentId);

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match our interface
      const transformedData = data?.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        role: p.role,
        created_at: p.created_at,
        profile: p.profiles ? { display_name: p.profiles.display_name } : undefined,
      })) || [];

      setParticipants(transformedData);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participant status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-danger-200 dark:border-danger-800">
        <CardContent className="pt-6 flex items-center gap-2 text-danger-700 dark:text-danger-300">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </CardContent>
      </Card>
    );
  }

  // Check if partner has joined (more than 1 participant means partner joined)
  const partnerParticipant = participants.find(p => p.role === 'partner');
  const hasPartner = partnerParticipant !== undefined;

  if (hasPartner && partnerParticipant) {
    // Partner has joined
    const joinedDate = new Date(partnerParticipant.created_at);
    const formattedDate = joinedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Card className="border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-950/20">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-success-600 dark:text-success-400" />
            <h3 className="text-sm font-semibold text-success-900 dark:text-success-100">
              Partner Joined
            </h3>
            <Badge variant="outline" className="ml-auto border-success-300 dark:border-success-700 text-success-700 dark:text-success-300">
              Active
            </Badge>
          </div>

          <div className="text-sm text-success-800 dark:text-success-200">
            <p>
              <span className="font-medium">
                {partnerParticipant.profile?.display_name || 'Your partner'}
              </span>
              {' '}joined this alignment
            </p>
            <p className="text-xs text-success-600 dark:text-success-400 mt-1">
              {formattedDate}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Partner has not joined yet - show waiting state with share link
  return (
    <div className="space-y-4">
      {/* Waiting Status Card */}
      <Card className="border-warning-200 dark:border-warning-800 bg-warning-50/50 dark:bg-warning-950/20">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Clock className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-warning-500"></span>
              </span>
            </div>
            <h3 className="text-sm font-semibold text-warning-900 dark:text-warning-100">
              Waiting for Partner
            </h3>
            <Badge variant="outline" className="ml-auto border-warning-300 dark:border-warning-700 text-warning-700 dark:text-warning-300">
              Pending
            </Badge>
          </div>

          <div className="text-sm text-warning-800 dark:text-warning-200">
            <p>
              Your partner hasn't joined yet. Share the link below so they can start thinking through this decision with you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Share Link Card */}
      {showRegenerateButton && (
        <ShareLinkButton alignmentId={alignmentId} />
      )}
    </div>
  );
}
