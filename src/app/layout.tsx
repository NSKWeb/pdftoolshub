import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dittopdf - Complete PDF Tool Suite",
  description: "Convert, compress, protect, and manage your PDFs with 16 powerful tools. Free for personal use.",
  keywords: "PDF tools, PDF merge, PDF split, PDF compress, PDF converter, PDF editor",
  openGraph: {
    title: "Dittopdf - Complete PDF Tool Suite",
    description: "Convert, compress, protect, and manage your PDFs with 16 powerful tools.",
    type: "website"
  }
};

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface text-slate-100">
        {adsenseClientId && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-slate-800 px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-xl font-semibold text-accent">Dittopdf</span>
                <span className="hidden sm:inline text-xs uppercase tracking-[0.3em] text-slate-400">
                  Phase 1 MVP
                </span>
              </Link>
              <Navigation />
            </div>
          </header>
          <div className="px-4 sm:px-6 py-3 bg-panel/40">
            <div className="max-w-7xl mx-auto">
              <AdSlot position="header" />
            </div>
          </div>
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="px-4 sm:px-6 py-8 border-t border-slate-800 text-xs text-slate-400">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Dittopdf</h3>
                  <p className="mb-2">Complete PDF tool suite for modern teams.</p>
                  <p className="text-slate-500">© 2024 Dittopdf. All rights reserved.</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Tools</h3>
                  <ul className="space-y-1">
                    <li>• Merge & Split PDFs</li>
                    <li>• Compress & Rotate</li>
                    <li>• Convert Formats</li>
                    <li>• Protect & Unlock</li>
                    <li>• Watermarks & Annotations</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Resources</h3>
                  <ul className="space-y-1">
                    <li>• Privacy Policy</li>
                    <li>• Terms of Service</li>
                    <li>• Contact Support</li>
                    <li>• Premium Plans</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <AdSlot position="footer" />
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
