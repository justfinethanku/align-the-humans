export default function JoinLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      aria-hidden="true"
    >
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-muted" />
          </div>
          <div className="mx-auto h-8 w-80 rounded-lg bg-muted" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg dark:shadow-2xl dark:shadow-black/50">
          <div className="mb-3 h-8 w-3/4 rounded-lg bg-muted" />

          <div className="mb-4 space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-4/6 rounded bg-muted" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>

          <div className="h-12 w-full rounded-lg bg-muted" />
        </div>

        <div className="mt-6 flex justify-center">
          <div className="h-4 w-96 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
