/**
 * Alignment Detail Loading Skeleton
 *
 * Matches the common alignment page layout to prevent visual flash
 */
export default function AlignmentLoading() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center">
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          {/* Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-72 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-5 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          {/* Content block */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 space-y-4">
            <div className="h-5 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-5 w-4/5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-5 w-3/5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-32 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse mt-4" />
          </div>
        </div>
      </main>
    </div>
  );
}
