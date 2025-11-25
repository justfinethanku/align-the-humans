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
import { Bell, Plus, Search, UserPlus, Loader2, HeartHandshake, LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/app/lib/supabase-browser';
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
  const supabase = createClient();
  const [partnerSearchQuery, setPartnerSearchQuery] = React.useState('');
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

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

          {/* Right side: Notifications + User Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full text-slate-500 dark:text-slate-400"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </Button>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={undefined} alt={`Avatar for ${displayName || userEmail}`} />
                    <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName || 'User'}</p>
                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 size-4" />
                  )}
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              // Enhanced Empty State
              <div className="flex flex-col rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-900/30">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <HeartHandshake className="size-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Welcome to Human Alignment
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Let&apos;s get you started with your first alignment
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Human Alignment helps you and a partner reach clear agreements through structured AI-guided conversations. Here&apos;s how it works:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800/50">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">1</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Define</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Clarify what you need to decide together</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800/50">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">2</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Answer</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Each person answers questions privately</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800/50">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">3</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Align</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">AI helps find common ground and resolve conflicts</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Pro tip:</strong> Start with something simple like a chore schedule or weekend plans. Build trust in the process before tackling bigger decisions.
                  </p>
                </div>

                <Button
                  onClick={handleNewAlignment}
                  size="lg"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white sm:w-auto"
                >
                  <Plus className="mr-2 size-5" />
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
                  // Find the partner to get their profile info
                  const partner = filteredPartners.find(p => p.id === partnerId);
                  if (partner?.profile) {
                    // Navigate to new alignment with partner pre-selected
                    const partnerName = encodeURIComponent(partner.profile.display_name || '');
                    const partnerUserId = partner.profile.id;
                    router.push(`/alignment/new?partnerId=${partnerUserId}&partnerName=${partnerName}`);
                  }
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
