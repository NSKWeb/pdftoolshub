export default function Loading() {
  return (
    <section className="px-4 sm:px-6 py-12 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-800 rounded w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-40 bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}
