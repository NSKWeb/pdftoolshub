import Link from "next/link";

type NewsprintPageProps = {
  section: string;
  title: string;
  tagline?: string;
  updated?: string;
  children: React.ReactNode;
};

export function NewsprintPage({
  section,
  title,
  tagline,
  updated,
  children,
}: NewsprintPageProps) {
  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="dept-tag">{section}</div>
            {updated && (
              <span className="text-xs text-phantom tracking-wide">
                Updated {updated}
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black mt-4 mb-3 text-ink leading-tight">
            {title}
          </h1>
          {tagline && <p className="text-inksoft text-lg">{tagline}</p>}
        </div>

        <div className="neo-card rounded-sm p-6 sm:p-10 mb-10">
          <div className="space-y-6">{children}</div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="dept-tag !border-ink shadow-offset-sm !text-[0.7rem] hover:bg-vermilion hover:text-cream transition"
          >
            ← Back to the Tools
          </Link>
        </div>
      </div>
    </section>
  );
}