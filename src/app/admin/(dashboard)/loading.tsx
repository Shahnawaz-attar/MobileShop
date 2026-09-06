export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-border" />
          <div className="h-4 w-64 rounded bg-border" />
        </div>
        <div className="h-11 w-36 rounded-lg bg-border" />
      </div>

      {/* Stats / content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card p-5">
            <div className="h-3 w-20 rounded bg-border" />
            <div className="mt-4 h-8 w-16 rounded bg-border" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-card" />
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
