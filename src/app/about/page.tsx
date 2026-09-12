import { NewsprintPage } from "@/components/newsprint-page";

export const metadata = {
  title: "About Us — PDFToolsHub",
  description:
    "The story behind PDFToolsHub — the self-hosted magazine of PDF utility.",
};

const features = [
  { k: "26", v: "editors on the block — every common PDF job covered" },
  { k: "0", v: "external SaaS in the pipeline — everything runs in-process" },
  { k: "1", v: "tiny VPS is enough — No Ghostscript, no GraphicsMagick, no root services" },
  { k: "9/9", v: "Jest suite passing, plus a clean type-check and production build on every push" },
];

const timeline = [
  { year: "Volume I", text: "A single merge tool appears in a small utilities folder." },
  { year: "Volume VII", text: "Split, rotate, and compress join the rotation." },
  { year: "Volume XIII", text: "Conversions, OCR, watermarks extend the catalogue to twenty-six departments." },
  { year: "Volume XXVI", text: "Full production-grade rebuild — server-side processing, auth, API, VPS deployment, CI." },
];

export default function AboutPage() {
  return (
    <NewsprintPage
      section="The Masthead"
      title="About Us"
      tagline="Twenty-six ways to set your documents free."
      updated="12 Sep 2026"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">The Story</h2>
        <div className="text-inksoft leading-relaxed space-y-3">
          <p>
            PDFToolsHub started as a scratchpad for one recurring frustration: PDF tools
            online are either paywalled, spying on your documents, or both. The fix was to
            build the whole workshop as a single, self-hostable application — every common
            PDF job in one place, with the processing running on your own hardware.
          </p>
          <p>
            The result is a web app styled like a newsprint magazine and built like a
            production service: strict TypeScript, tested engines, guarded API routes, and a
            deployment path that fits on a single 1&nbsp;GB VPS.
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold text-ink mb-3">By the Numbers</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.k} className="border-2 border-ink p-4 shadow-offset-sm bg-paper">
              <p className="font-display text-3xl font-black text-vermilion">{f.k}</p>
              <p className="text-xs sm:text-sm text-inksoft mt-1 leading-snug">{f.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold text-ink mb-3">The Back Pages</h2>
        <div className="space-y-3">
          {timeline.map((t) => (
            <div key={t.year} className="flex gap-4 border-l-2 border-vermilion pl-4">
              <span className="font-display font-black text-vermilion whitespace-nowrap">{t.year}</span>
              <span className="text-inksoft leading-snug">{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">Open Source</h2>
        <div className="text-inksoft leading-relaxed space-y-3">
          <p>
            The project is MIT-licensed and lives on GitHub as{" "}
            <a
              href="https://github.com/NSKWeb/pdftoolshub"
              className="underline underline-offset-2 text-cobalt hover:text-vermilion transition"
            >
              NSKWeb/pdftoolshub
            </a>
            . Files, issues, and pull requests are welcome.
          </p>
          <p className="text-sm text-phantom">
            Set in Fraunces &amp; Archivo · Printed off-line · 100% fiber-free.
          </p>
        </div>
      </div>
    </NewsprintPage>
  );
}