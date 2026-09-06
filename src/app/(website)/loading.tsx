export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <section className="border-b border-border bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-10 w-3/4 rounded-xl bg-slate-200 sm:h-14" />
              <div className="mt-3 h-10 w-2/3 rounded-xl bg-slate-200 sm:h-14" />
              <div className="mt-5 h-4 w-full max-w-md rounded bg-slate-200" />
              <div className="mt-4 h-4 w-2/3 max-w-sm rounded bg-slate-200" />
              <div className="mt-8 h-12 w-full max-w-md rounded-full bg-slate-200" />
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="aspect-[4/5] w-72 rounded-3xl bg-slate-200/80" />
            </div>
          </div>
        </div>
      </section>

      {/* Brand / section skeletons */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-6 w-56 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white">
              <div className="aspect-[4/5] bg-slate-200/80" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-5 w-full rounded bg-slate-200" />
                <div className="h-8 w-24 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
