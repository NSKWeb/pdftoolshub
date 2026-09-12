import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/archivo";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFToolsHub — The Magazine of PDF Utility",
  description:
    "Convert, compress, protect, and manage your PDFs with 26 powerful tools. Free for personal use, no sign-up required.",
  keywords:
    "PDF tools, PDF merge, PDF split, PDF compress, PDF converter, PDF editor, OCR",
  openGraph: {
    title: "PDFToolsHub — The Magazine of PDF Utility",
    description: "Convert, compress, protect, and manage your PDFs with 26 powerful tools.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-body">
      <body className="grain">
        <div className="min-h-screen flex flex-col">
          {/* Masthead — the editorial newspaper header */}
          <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b-4 border-ink px-4 sm:px-6">
            <div className="max-w-7xl mx-auto py-3 flex items-end justify-between gap-4">
              <Link href="/" className="flex items-end gap-3 min-w-0">
                <span className="font-display text-2xl sm:text-3xl leading-none tracking-tight font-bold">
                  PDF Tools Hub
                </span>
                <span className="hidden sm:inline eyebrow !text-[0.6rem] pb-1">
                  No. 26 — All Tools Free
                </span>
              </Link>
              <div className="flex items-center gap-2 pb-1">
                <Navigation />
              </div>
            </div>
            <div className="barcode max-w-7xl mx-auto" aria-hidden="true" />
          </header>
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          {/* Colophon — magazine back-matter */}
          <footer className="border-t-4 border-ink px-4 sm:px-6 py-8 bg-cream">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-8 md:grid-cols-3 text-ink">
                <div>
                  <h3 className="font-display text-lg font-bold mb-2">PDFToolsHub</h3>
                  <p className="text-inksoft mb-2 text-sm">
                    Twenty-six ways to set your documents free. Printed on recycled electrons.
                  </p>
                  <p className="text-xs text-phantom">
                    © {new Date().getFullYear()} PDFToolsHub. All rights reserved.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-2">
                    Departments
                  </h3>
                  <ul className="space-y-1 text-sm text-inksoft">
                    <li>— Merge &amp; Split</li>
                    <li>— Compress &amp; Rotate</li>
                    <li>— Convert Formats</li>
                    <li>— OCR &amp; Redact</li>
                    <li>— Watermarks &amp; Notes</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-2">
                    Colophon
                  </h3>
                  <ul className="space-y-1 text-sm text-inksoft">
                    <li>— Terms of Service</li>
                    <li>— Privacy Policy</li>
                    <li>— How-to Guides</li>
                  </ul>
                </div>
              </div>
              <div className="barcode mt-8" aria-hidden="true" />
              <p className="text-[0.65rem] text-phantom mt-3 text-center tracking-wide">
                SET IN FRAUNCES &amp; ARCHIVO · PRINTED OFF-LINE · 100% FIBER-FREE
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
