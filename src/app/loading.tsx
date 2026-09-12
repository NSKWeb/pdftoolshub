export default function Loading() {
  return (
    <section className="px-4 sm:px-6 py-12 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-6">
        <div className="h-10 bg-ink/15 border-2 border-ink w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-36 border-2 border-ink bg-cream shadow-offset-sm" />
          ))}
        </div>
      </div>
    </section>
  );
}
