import Image from "next/image";
import Link from "next/link";
import { tools, toolAccentHex, type ToolCategory } from "@/lib/tools";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free Online PDF Tools — Merge, Split, Compress & Convert",
  description:
    "Twenty-six free online PDF tools: merge, split, compress, rotate, convert, OCR, watermark, redact, and more. No sign-up, files processed securely and deleted after 1 hour.",
  path: "/",
});

const categoryMeta: { name: ToolCategory; tagline: string }[] = [
  { name: "Basic Tools", tagline: "The essentials." },
  { name: "Convert Tools", tagline: "Transfigurations." },
  { name: "Edit Tools", tagline: "The red pencil." },
  { name: "Security/Privacy", tagline: "The vault." },
  { name: "Advanced Tools", tagline: "The deep shelf." }
];

export default function HomePage() {
  return (
    <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-12">
          {/* Cover story — the declaration */}
          <div className="space-y-6">
            <Image
              src="/screenshots/hero.svg"
              alt="PDFToolsHub — twenty-six free PDF tools, no sign-up, self-hosted"
              width={1280}
              height={420}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="w-full h-auto border-2 border-ink shadow-offset bg-paper"
            />
            <div className="space-y-5">
              <div className="dept-tag">The Tool Issue · Vol. 26</div>
              <h1 className="font-display text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight">
                Every document,
                <br />
                <span className="bg-vermilion text-cream px-3 -rotate-1 inline-block">
                  set free.
                </span>
              </h1>
              <p className="text-inksoft max-w-2xl text-lg font-body">
                Convert, compress, edit, and manage your documents in one secure
                workspace. Twenty-six tools, no sign-up, free forever.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["26 PDF Tools", "Free Forever", "No Sign-up Required", "Secure & Private"].map(
                  (item) => (
                    <span key={item} className="dept-tag !border-ink !shadow-offset-sm">
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* The workflow — one diagram, three moves */}
          <figure className="space-y-3">
            <Image
              src="/workflow.svg"
              alt="The workflow: upload a file, process it in-process, download the result"
              width={1200}
              height={320}
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="w-full h-auto border-2 border-ink shadow-offset-sm bg-paper"
            />
            <figcaption className="eyebrow text-center">
              Upload → Process → Download · nothing leaves the press
            </figcaption>
          </figure>

          {categoryMeta.map((category, idx) => {
            const items = tools.filter((tool) => tool.category === category.name);
            return (
              <div key={category.name} className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
                  <h2 className="font-display text-3xl font-bold tracking-tight">
                    {category.name}
                  </h2>
                  <span className="eyebrow hidden sm:block">{category.tagline}</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {items.map((tool, toolIdx) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="neo-card rounded-sm p-5 block"
                    >
                      <Image
                        src={`/tools/${tool.slug}.svg`}
                        alt={`${tool.name} illustration`}
                        width={1200}
                        height={420}
                        sizes="(max-width: 640px) 100vw, 420px"
                        className="w-full h-auto border-2 border-ink mb-4 bg-paper"
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-display text-lg font-bold leading-tight">
                          {tool.name}
                        </div>
                        <span
                          className="font-display text-xs whitespace-nowrap border border-ink px-1.5 py-0.5"
                          style={{ color: toolAccentHex[tool.accent] }}
                        >
                          {String(toolIdx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-sm text-inksoft mt-2">{tool.description}</p>
                      <div className="text-sm font-display font-semibold text-vermilion mt-3">
                        Open →
                      </div>
                    </Link>
                  ))}
                </div>
                {idx === 0 && <div className="barcode" aria-hidden="true" />}
              </div>
            );
          })}

          {/* The pipeline, explained in full */}
          <figure className="space-y-3">
            <div className="border-b-4 border-ink pb-2">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                How the press works
              </h2>
            </div>
            <Image
              src="/infographics/how-it-works.svg"
              alt="Step-by-step infographic: upload your file, choose a tool, and download the processed result — with the engines and house rules listed"
              width={1000}
              height={1620}
              sizes="(max-width: 1280px) 100vw, 760px"
              className="w-full h-auto max-w-3xl mx-auto border-2 border-ink shadow-offset bg-paper"
            />
          </figure>
        </div>

        {/* Right rail — the cover lines of the issue */}
        <div className="space-y-6 lg:pt-10">
          <div id="fine-print" className="neo-card rounded-sm p-5 space-y-4 scroll-mt-24">
            <div className="eyebrow">The Fine Print</div>
            <div className="space-y-4">
              <div className="border-l-4 border-vermilion pl-3">
                <div className="font-display text-2xl font-bold">Free Plan</div>
                <p className="text-sm text-inksoft">5 files / day — perfect for occasional use</p>
              </div>
              <div className="border-l-4 border-cobalt pl-3">
                <div className="font-display text-2xl font-bold text-cobalt">Pro Plan</div>
                <p className="text-sm text-inksoft">Unlimited — for power users and teams</p>
              </div>
            </div>
          </div>

          <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
            <div className="eyebrow mb-3">House Rules</div>
            <ul className="space-y-2">
              {[
                "Max 25MB file size",
                "Local file processing",
                "1-hour file retention",
                "No account required"
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-vermilion font-bold" aria-hidden="true">
                    ✓
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="space-y-2">
            <Image
              src="/infographics/security.svg"
              alt="Security model diagram: your document is processed on your own press and deleted after one hour"
              width={800}
              height={420}
              sizes="300px"
              className="w-full h-auto border-2 border-ink shadow-offset-sm bg-paper"
            />
            <figcaption className="eyebrow text-center">The vault</figcaption>
          </figure>

          <div className="neo-card bg-ink text-cream rounded-sm p-5">
            <div className="eyebrow !text-cream/70 mb-2">Readers’ Poll</div>
            <p className="font-display text-xl font-bold leading-snug">
              “The fastest sheet in the West.”
            </p>
            <p className="text-cream/70 text-xs mt-3">
              — A satisfied reader, on Merge PDFs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
