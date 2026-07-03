export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      <header className="sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-9 w-36 rounded bg-muted" />
            <div className="h-9 w-9 rounded-full bg-muted" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 w-40 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6 space-y-4"
            >
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-8 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
