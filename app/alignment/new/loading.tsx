/**
 * New Alignment Loading Skeleton
 *
 * Matches the page layout to prevent visual flash during load
 */
export default function NewAlignmentLoading() {
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
        <div className="w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Title skeleton */}
          <div className="flex flex-col items-center gap-4 text-center mb-10">
            <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-10 w-80 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-6 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-4"
              >
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="space-y-2 flex flex-col items-center">
                  <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="h-9 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
