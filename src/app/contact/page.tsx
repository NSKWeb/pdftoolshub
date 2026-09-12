import { NewsprintPage } from "@/components/newsprint-page";

export const metadata = {
  title: "Contact Us — PDFToolsHub",
  description:
    "Reach the crew behind PDFToolsHub — bug reports, feature requests, or press inquiries.",
};

const channels = [
  {
    name: "GitHub Issues",
    desc: "The fastest route — open an issue with a description, browser, and steps.",
    cta: "Open an issue",
    href: "https://github.com/NSKWeb/pdftoolshub/issues",
  },
  {
    name: "Email",
    desc: "For press, partnerships, and anything you would rather keep off GitHub.",
    cta: "Send an email",
    href: "mailto:hello@nsweb.dev",
  },
  {
    name: "Report a Vulnerability",
    desc: "Found a hole in the press room? We want to know — please share details privately.",
    cta: "Security contact",
    href: "https://github.com/NSKWeb/pdftoolshub/security",
  },
];

export default function ContactPage() {
  return (
    <NewsprintPage
      section="Letters to the Editor"
      title="Contact Us"
      tagline="Pick a channel — every letter is read, most are printed."
      updated="12 Sep 2026"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channels.map((c) => (
          <div key={c.name} className="border-2 border-ink p-5 shadow-offset-sm bg-paper flex flex-col">
            <h3 className="font-display font-bold text-ink mb-2">{c.name}</h3>
            <p className="text-sm text-inksoft leading-snug flex-1 mb-4">{c.desc}</p>
            <a
              href={c.href}
              className="dept-tag self-start !border-ink shadow-offset-sm !text-[0.7rem] hover:bg-vermilion hover:text-cream transition"
            >
              {c.cta} →
            </a>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-ink pt-6 mt-2">
        <h2 className="font-display text-xl font-bold text-ink mb-3">
          Common Questions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-display font-bold text-ink mb-1">
              Can I host this on my own server?
            </h3>
            <p className="text-sm text-inksoft leading-relaxed">
              Yes — that&apos;s the whole point. A complete VPS guide lives in{" "}
              <a
                href="https://github.com/NSKWeb/pdftoolshub/blob/prod/DEPLOY.md"
                className="underline underline-offset-2 text-cobalt hover:text-vermilion transition"
              >
                DEPLOY.md
              </a>
              , with systemd units, an nginx config, and a rebuild script inside{" "}
              <code>deploy/</code>.
            </p>
          </div>
          <div>
            <h3 className="font-display font-bold text-ink mb-1">
              Do you sell or share my documents?
            </h3>
            <p className="text-sm text-inksoft leading-relaxed">
              Never. Files are processed on the server and returned to you; see the{" "}
              <a href="/privacy" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
                Privacy Policy
              </a>{" "}
              for the full picture.
            </p>
          </div>
          <div>
            <h3 className="font-display font-bold text-ink mb-1">
              Which tools are available?
            </h3>
            <p className="text-sm text-inksoft leading-relaxed">
              26 in total — everything from merge, split, compress, and rotate to OCR,
              watermarks, redaction, and conversions. Browse them all on the{" "}
              <a href="/" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
                landing page
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </NewsprintPage>
  );
}