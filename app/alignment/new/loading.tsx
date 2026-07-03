export default function NewAlignmentLoading() {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      <header className="sticky top-0 z-50 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center mb-10">
            <div className="h-5 w-20 rounded bg-muted" />
            <div className="h-10 w-80 rounded bg-muted" />
            <div className="h-6 w-96 rounded bg-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-6 space-y-4"
              >
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-lg bg-muted" />
                </div>
                <div className="space-y-2 flex flex-col items-center">
                  <div className="h-5 w-32 rounded bg-muted" />
                  <div className="h-4 w-48 rounded bg-muted" />
                </div>
                <div className="h-9 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
