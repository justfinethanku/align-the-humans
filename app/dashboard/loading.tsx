/**
 * Dashboard Loading Skeleton
 *
 * Matches the dashboard layout to prevent visual flash
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-9 w-36 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-4"
            >
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
