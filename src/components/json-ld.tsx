import { SITE_URL } from "@/lib/seo";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
};

/**
 * Renders schema.org JSON-LD. Values are serialized from local, typed objects
 * (never user input), so the inline script is safe from injection.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PDFToolsHub",
    url: SITE_URL,
    description:
      "Twenty-six free online tools to merge, split, compress, convert, and edit PDF files.",
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "PDFToolsHub",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "A self-hostable workspace of twenty-six PDF utilities for merging, splitting, converting, compressing, OCR, and editing documents.",
  };
}

export function softwareApplicationSchema(tool: {
  slug: string;
  name: string;
  description: string;
}) {
  const url = `${SITE_URL}/tools/${tool.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    url,
    description: tool.description,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "PDF",
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
