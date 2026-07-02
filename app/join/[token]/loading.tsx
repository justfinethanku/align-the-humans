/**
 * Loading State for Join Page
 *
 * Displays a loading skeleton while validating token and fetching alignment data.
 * Matches the design of the main join page for smooth transition.
 */

export default function JoinLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header Skeleton */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mx-auto h-8 w-80 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
          {/* Title Skeleton */}
          <div className="mb-3 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />

          {/* Description Skeleton */}
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>

          {/* Creator Info Skeleton */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>

          {/* Expiration Skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>

          {/* Button Skeleton */}
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Info Text Skeleton */}
        <div className="mt-6 flex justify-center">
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
