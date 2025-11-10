/**
 * Loading State for Join Page
 *
 * Displays a loading skeleton while validating token and fetching alignment data.
 * Matches the design of the main join page for smooth transition.
 */

export default function JoinLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#1A1A1A] dark:to-[#1A1A1A] p-4">
      <div className="w-full max-w-2xl">
        {/* Header Skeleton */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mx-auto h-8 w-80 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Card Skeleton */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#252525] p-6 sm:p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
          {/* Title Skeleton */}
          <div className="mb-3 h-8 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />

          {/* Description Skeleton */}
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Creator Info Skeleton */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Expiration Skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Button Skeleton */}
          <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Info Text Skeleton */}
        <div className="mt-6 flex justify-center">
          <div className="h-4 w-96 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
