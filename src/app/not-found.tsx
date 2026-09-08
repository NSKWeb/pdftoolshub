import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-4 sm:px-6 py-16 max-w-2xl mx-auto text-center">
      <div className="gradient-border rounded-xl p-12 bg-panel">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-2 rounded-md bg-accent text-slate-900 font-medium hover:opacity-90 transition"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2 rounded-md border border-slate-600 hover:border-slate-500 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
