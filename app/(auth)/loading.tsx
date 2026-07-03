export default function AuthLoading() {
  return (
    <div className="w-full space-y-6" aria-hidden="true">
      <div className="mx-auto h-7 w-48 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 h-10 w-full rounded bg-muted" />
        <div className="mb-4 h-10 w-full rounded bg-muted" />
        <div className="h-11 w-full rounded bg-primary/20" />
      </div>
    </div>
  );
}
