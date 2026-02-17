/**
 * Admin System Page
 * System health, configuration, and maintenance (placeholder)
 */

export default function AdminSystemPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">System</h1>
        <p className="mt-2 text-zinc-400">
          System health, configuration, and maintenance
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
        <div className="mx-auto max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-zinc-100">
            Coming Soon
          </h2>
          <p className="mt-2 text-zinc-400">
            System management interface will be available in a future update.
            This will include health checks, environment configuration,
            database monitoring, and maintenance tools.
          </p>
        </div>
      </div>
    </div>
  );
}
