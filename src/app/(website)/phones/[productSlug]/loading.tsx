export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:py-8 sm:px-6 lg:px-8 bg-[#f5f5f7] min-h-screen">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square w-full rounded-[2rem] bg-slate-200/80" />

        <div className="flex flex-col gap-4">
          <div className="h-7 w-24 rounded-full bg-slate-200" />
          <div className="h-4 w-full max-w-md rounded bg-slate-200" />
          <div className="h-10 w-3/4 rounded-xl bg-slate-200" />
          <div className="h-5 w-1/2 rounded bg-slate-200" />
          <div className="mt-2 h-12 w-40 rounded-lg bg-slate-200" />
          <div className="mt-4 h-28 rounded-2xl bg-slate-200/80" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-[1.5rem] bg-slate-200/80" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
