import { NewsprintPage } from "@/components/newsprint-page";

export const metadata = {
  title: "Privacy Policy — PDFToolsHub",
  description:
    "How PDFToolsHub handles your files, account data, and cookies.",
};

const sections = [
  {
    heading: "1 · What We Collect",
    body: (
      <>
        <p>
          <strong>Files you upload.</strong> Documents you send to the tools are stored
          temporarily on the server long enough to be processed, then served back to you as a
          download. Depending on how this instance is deployed (locally, on S3, or on
          Cloudinary) processed files may be persisted for a retention period.
        </p>
        <p>
          <strong>Account data.</strong> If you register, we store the email address and a
          hashed password (bcrypt) needed to sign you in, plus your subscription plan.
        </p>
        <p>
          <strong>Usage logs.</strong> Standard request logs (IP address, timestamp,
          endpoint) are kept for rate limiting and abuse prevention.
        </p>
      </>
    ),
  },
  {
    heading: "2 · How Files Are Processed",
    body: (
      <p>
        Processing happens automatically on the server. The engines — pdf-lib, pdfjs-dist,
        tesseract.js, and @napi-rs/canvas — run entirely in-process. No third-party SaaS
        receives your documents during processing. If object storage (S3 or Cloudinary) is
        configured, processed files are sent there for download delivery.
      </p>
    ),
  },
  {
    heading: "3 · Cookies & Sessions",
    body: (
      <p>
        When you sign in we set an HTTP-only cookie containing a signed JWT session token.
        This cookie is required to keep you signed in and is not used for advertising or
        tracking. Closing your session (or the expiry of the token) removes its validity.
      </p>
    ),
  },
  {
    heading: "4 · Retention & Deletion",
    body: (
      <p>
        Temporary uploads are deleted after processing. Files persisted to object storage
        should be removed by the operator according to their retention policy. You may
        request deletion of your account and associated data by contacting the operator of
        this instance.
      </p>
    ),
  },
  {
    heading: "5 · Third-Party Services",
    body: (
      <ul className="space-y-2 pl-5 list-disc text-inksoft leading-relaxed">
        <li>
          <strong>Object storage</strong> — S3 or Cloudinary, if configured, stores processed
          files for download.
        </li>
        <li>
          <strong>PostgreSQL</strong> — stores account records and, when enabled, file usage
          history.
        </li>
        <li>
          <strong>Fonts & assets</strong> — served from self-hosted packages; no external
          CDN calls are required.
        </li>
      </ul>
    ),
  },
  {
    heading: "6 · Security",
    body: (
      <p>
        Passwords are hashed with bcrypt. Session tokens are signed JWTs and set as
        HTTP-only cookies. API endpoints are rate-limited, uploads are size-checked, and the
        middleware applies security headers (CSP, HSTS, nosniff) on every response. No system
        setup is foolproof, however — you use the Service at your own risk.
      </p>
    ),
  },
  {
    heading: "7 · Your Rights",
    body: (
      <p>
        Depending on your jurisdiction you may have the right to access, correct, or delete
        personal data we hold about you. To exercise these rights, contact the operator of
        this instance at the address on our{" "}
        <a href="/contact" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
          Contact page
        </a>
        .
      </p>
    ),
  },
  {
    heading: "8 · Changes to This Policy",
    body: (
      <p>
        We may update this policy as the Service evolves. Significant changes will be noted
        on the page with a new "Updated" date. Continued use of the Service after changes
        take effect constitutes acceptance of the revised policy.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <NewsprintPage
      section="The Confidential Column"
      title="Privacy Policy"
      tagline="Your documents are your business — ours is the press work."
      updated="12 Sep 2026"
      illustration={{
        src: "/images/privacy-illustration.svg",
        alt: "Editorial illustration — padlock, redacted document, security shield, and fingerprint",
      }}
    >
      {sections.map((s) => (
        <div key={s.heading}>
          <h2 className="font-display text-xl font-bold text-ink mb-2">{s.heading}</h2>
          <div className="text-inksoft leading-relaxed space-y-3">{s.body}</div>
        </div>
      ))}

      <div className="border-t-2 border-ink pt-6 mt-8">
        <p className="text-sm text-phantom">
          Need something deleted or corrected?{" "}
          <a href="/contact" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
            Contact us
          </a>
          .
        </p>
      </div>
    </NewsprintPage>
  );
}