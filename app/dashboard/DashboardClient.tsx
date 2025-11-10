'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlignmentCard } from '@/components/dashboard/AlignmentCard';
import { PartnersList, type PartnerWithDetails } from '@/components/dashboard/PartnersList';
import { AddPartnerModal } from '@/components/dashboard/AddPartnerModal';
import { useDashboardData } from '@/app/lib/hooks/useDashboardData';
import { usePartners } from '@/app/lib/hooks/usePartners';
import { useAlignmentUpdates } from '@/app/lib/hooks/useAlignmentUpdates';
import { Bell, Plus, Search, UserPlus, Loader2, HeartHandshake } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface DashboardClientProps {
  userId: string;
  userEmail: string;
  displayName: string | null;
}

/**
 * DashboardClient Component
 *
 * Client component with all interactive features:
 * - Real-time alignment updates
 * - Search functionality
 * - Modal interactions
 * - Navigation
 *
 * Layout matches design template:
 * - Header with logo, notifications, avatar
 * - Two-column grid (alignments + partners)
 * - Responsive design
 * - Dark/light mode support
 */
export function DashboardClient({ userId, userEmail, displayName }: DashboardClientProps) {
  const router = useRouter();
  const [partnerSearchQuery, setPartnerSearchQuery] = React.useState('');
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = React.useState(false);

  // Fetch alignments data
  const {
    alignments,
    loading: alignmentsLoading,
    error: alignmentsError,
    refetch: refetchAlignments
  } = useDashboardData();

  // Fetch partners data
  const {
    partners: rawPartners,
    loading: partnersLoading,
    error: partnersError,
    refetch: refetchPartners
  } = usePartners();

  // Subscribe to real-time alignment updates
  useAlignmentUpdates({
    enabled: true,
    onUpdate: () => {
      // Refresh alignments when an update is received
      refetchAlignments();
    },
    onInsert: () => {
      refetchAlignments();
    },
  });

  // Transform partners data to match PartnerWithDetails interface
  // Profile data is now fetched by usePartners hook
  const partners: PartnerWithDetails[] = React.useMemo(() => {
    return rawPartners.map(partner => ({
      ...partner,
      profile: partner.profile,
      alignment_count: partner.alignment_count,
    }));
  }, [rawPartners]);

  // Filter partners by search query
  const filteredPartners = React.useMemo(() => {
    if (!partnerSearchQuery.trim()) return partners;

    const query = partnerSearchQuery.toLowerCase();
    return partners.filter(partner =>
      partner.profile?.display_name?.toLowerCase().includes(query)
    );
  }, [partners, partnerSearchQuery]);

  // Get user initials for avatar
  const userInitials = React.useMemo(() => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userEmail.substring(0, 2).toUpperCase();
  }, [displayName, userEmail]);

  // Handle alignment click
  const handleAlignmentClick = (alignment: any) => {
    router.push(`/alignment/${alignment.id}`);
  };

  // Handle partner added
  const handlePartnerAdded = () => {
    refetchPartners();
    setIsAddPartnerModalOpen(false);
  };

  // Handle new alignment button
  const handleNewAlignment = () => {
    router.push('/alignment/new');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b border-slate-200/80 bg-background/80 backdrop-blur-sm dark:border-slate-800/20 dark:bg-background-dark/80">
        <div className="flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <HeartHandshake className="size-7 text-primary-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Align The Humans
            </h2>
          </div>

          {/* Right side: Notifications + Avatar */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full text-slate-500 dark:text-slate-400"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </Button>
            <Avatar className="size-10">
              <AvatarImage src={undefined} alt={`Avatar for ${displayName || userEmail}`} />
              <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-1 justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid w-full max-w-7xl grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Current Alignments (2/3 width on desktop) */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Header */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Current Alignments
              </h1>
              <Button
                onClick={handleNewAlignment}
                className="flex h-11 w-full shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-primary-500 px-5 text-base font-semibold text-white shadow-md shadow-primary-500/30 transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 sm:w-auto"
              >
                <Plus className="size-5" />
                <span className="truncate">Start New Alignment</span>
              </Button>
            </div>

            {/* Alignments Grid */}
            {alignmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary-500" />
              </div>
            ) : alignmentsError ? (
              <div
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
                role="alert"
              >
                <p className="font-semibold">Error loading alignments</p>
                <p className="mt-1">{alignmentsError.message}</p>
              </div>
            ) : alignments.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/30">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                  <svg
                    className="size-8 text-slate-400 dark:text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Start Your First Alignment
                </h3>
                <p className="mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Try it with something simple - a chore schedule, project kickoff, or weekend plans. Build trust in the structure with low-stakes decisions.
                </p>
                <Button
                  onClick={handleNewAlignment}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Plus className="mr-2 size-4" />
                  Start Your First Alignment
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {alignments.map((alignment) => (
                  <AlignmentCard
                    key={alignment.id}
                    alignment={alignment as any}
                    onClick={handleAlignmentClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Your Partners (1/3 width on desktop) */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Your Partners
              </h2>
              <Button
                onClick={() => setIsAddPartnerModalOpen(true)}
                variant="outline"
                className="flex h-10 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-lg border-slate-300 bg-background px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:shadow-md dark:border-slate-700/60 dark:bg-card-dark dark:text-slate-200 dark:shadow-none dark:hover:bg-slate-700/40 sm:w-auto"
              >
                <UserPlus className="size-4" />
                <span className="truncate">Add Partner</span>
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                type="search"
                placeholder="Search partners..."
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border-slate-300 bg-background pl-11 pr-4 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/60 dark:bg-card-dark dark:placeholder:text-slate-500 dark:focus:border-primary-500"
              />
            </div>

            {/* Partners List */}
            {partnersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary-500" />
              </div>
            ) : partnersError ? (
              <div
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                <p className="font-semibold">Error loading partners</p>
                <p className="mt-1">{partnersError.message}</p>
              </div>
            ) : (
              <PartnersList
                partners={filteredPartners}
                onPartnerClick={(partnerId) => {
                  // TODO: Navigate to partner detail page or filter alignments
                  console.log('Partner clicked:', partnerId);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Add Partner Modal */}
      <AddPartnerModal
        open={isAddPartnerModalOpen}
        onOpenChange={setIsAddPartnerModalOpen}
        onPartnerAdded={handlePartnerAdded}
      />
    </div>
  );
}
