import type { Metadata } from "next";
import { tools } from "@/lib/tools";

/**
 * Canonical site origin. Set NEXT_PUBLIC_SITE_URL to the production domain
 * (e.g. https://pdftoolshub.example) so canonical URLs, sitemap entries, and
 * Open Graph URLs resolve to the public site rather than the build host.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "PDFToolsHub";
export const SITE_TITLE = "PDFToolsHub — The Magazine of PDF Utility";
export const SITE_DESCRIPTION =
  "Convert, compress, protect, and manage your PDFs with 26 powerful tools. Free for personal use, no sign-up required.";
export const OG_IMAGE = "/og-image.png";
export const OG_IMAGE_ALT =
  "PDFToolsHub — 26 free online PDF tools for merging, splitting, compressing, converting, and editing documents";

export const LOGO_PATH = "/icon.svg";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  images?: string[];
};

/**
 * Builds per-route metadata with a canonical URL plus Open Graph and Twitter
 * card tags, reusing the shared image and site defaults.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  images = [OG_IMAGE],
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: images.map((image) => ({
        url: image,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export function toolDescription(tool: (typeof tools)[number]): string {
  const base = tool.description.replace(/\.$/, "");
  return `${base}. Free online ${tool.name} — no sign-up, files processed securely and deleted after 1 hour.`;
}
