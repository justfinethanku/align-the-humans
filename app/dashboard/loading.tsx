import { Loader2 } from 'lucide-react';

/**
 * Dashboard Loading State
 *
 * Displayed while server component fetches user data
 * Shows centered spinner with branded colors
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-12 animate-spin text-primary-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}
