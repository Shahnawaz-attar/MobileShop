export default function PhonesBrowseLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 h-10 w-48 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white">
            <div className="aspect-[4/5] bg-slate-200/80 sm:aspect-square" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-5 w-full rounded bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
