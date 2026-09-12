import { NewsprintPage } from "@/components/newsprint-page";

export const metadata = {
  title: "Terms of Service — PDFToolsHub",
  description:
    "The terms that govern your use of PDFToolsHub, the self-hosted magazine of PDF utility.",
};

const sections = [
  {
    heading: "1 · Acceptance of Terms",
    body: (
      <>
        <p>
          By accessing or using <strong>PDFToolsHub</strong> (the "Service"), you agree to be
          bound by these Terms of Service. If you do not agree with any part of these terms,
          you may not access or use the Service.
        </p>
        <p>
          This is a self-hostable application. Operators who deploy it on their own servers
          are responsible for their own deployment, data handling, and compliance with local
          law. Where this instance is hosted by a third party, that host's terms may also
          apply.
        </p>
      </>
    ),
  },
  {
    heading: "2 · The Service",
    body: (
      <p>
        The Service provides twenty-six tools for working with PDF documents — merging,
        splitting, converting, compressing, OCR, and related utilities. Tools accept the
        files you upload, process them on the server, and return a processed file for
        download. The Service is provided "as is" and "as available".
      </p>
    ),
  },
  {
    heading: "3 · Your Content",
    body: (
      <>
        <p>
          You retain all rights to the files you upload. You grant the Service a limited,
          non-exclusive license to store, process, and transmit your files solely for the
          purpose of providing the tools you request.
        </p>
        <p>
          You are solely responsible for the content of your files. Documents that violate
          applicable law, infringe third-party rights, or contain harmful material are not
          permitted and may be refused or removed without notice.
        </p>
      </>
    ),
  },
  {
    heading: "4 · Acceptable Use",
    body: (
      <ul className="space-y-2 pl-5 list-disc text-inksoft leading-relaxed">
        <li>Do not attempt to disrupt, overload, or probe the Service beyond normal use.</li>
        <li>Do not use the Service to process unlawful or infringing material.</li>
        <li>Do not interfere with other users&apos; files or accounts.</li>
        <li>Comply with the rate limits and API usage policies in force.</li>
      </ul>
    ),
  },
  {
    heading: "5 · Privacy",
    body: (
      <p>
        Processing of your files is described in our{" "}
        <a href="/privacy" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
          Privacy Policy
        </a>
        . By using the Service you consent to the collection and processing described there.
      </p>
    ),
  },
  {
    heading: "6 · No Warranty",
    body: (
      <p>
        The Service is provided without warranties of any kind, whether express or implied,
        including but not limited to implied warranties of merchantability, fitness for a
        particular purpose, and non-infringement. We do not warrant that the Service will be
        uninterrupted, error-free, or that processed output will always be valid in every
        PDF implementation.
      </p>
    ),
  },
  {
    heading: "7 · Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, PDFToolsHub and its contributors shall not
        be liable for any indirect, incidental, special, consequential, or punitive damages,
        or any loss of profits or revenues, whether incurred directly or indirectly, arising
        from your use of the Service.
      </p>
    ),
  },
  {
    heading: "8 · Changes to These Terms",
    body: (
      <p>
        We may revise these terms from time to time. The latest version will always be
        published on this page. Continued use of the Service after changes take effect
        constitutes acceptance of the revised terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <NewsprintPage
      section="The Fine Print"
      title="Terms of Service"
      tagline="The rules of the press room — short, sharp, and set in ink."
      updated="12 Sep 2026"
    >
      {sections.map((s) => (
        <div key={s.heading}>
          <h2 className="font-display text-xl font-bold text-ink mb-2">{s.heading}</h2>
          <div className="text-inksoft leading-relaxed space-y-3">{s.body}</div>
        </div>
      ))}

      <div className="border-t-2 border-ink pt-6 mt-8">
        <p className="text-sm text-phantom">
          Questions about these terms?{" "}
          <a href="/contact" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
            Get in touch
          </a>
          .
        </p>
      </div>
    </NewsprintPage>
  );
}