import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-4 sm:px-6 py-16 max-w-2xl mx-auto text-center">
      <div className="neo-card rounded-sm p-12">
        <div className="dept-tag">Errata</div>
        <h1 className="font-display text-7xl font-black text-vermilion mt-4">404</h1>
        <h2 className="font-display text-2xl font-bold mb-2 mt-1">Page not found</h2>
        <p className="text-inksoft mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="neo-btn neo-btn-accent rounded-sm">
            Go Home
          </Link>
          <Link href="/" className="neo-btn rounded-sm !bg-cream !text-ink">
            Browse Tools
          </Link>
        </div>
      </div>
    </section>
  );
}
