export default function AlignmentLoading() {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      <header className="sticky top-0 z-50 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-center">
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-72 rounded bg-muted" />
            <div className="h-5 w-96 rounded bg-muted" />
          </div>
          <div className="rounded-lg border border-border bg-card p-8 space-y-4">
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-4/5 rounded bg-muted" />
            <div className="h-5 w-3/5 rounded bg-muted" />
            <div className="h-32 w-full rounded bg-muted mt-4" />
          </div>
        </div>
      </main>
    </div>
  );
}
