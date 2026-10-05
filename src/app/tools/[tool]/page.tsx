import type { Metadata } from "next";
import { ToolUploadForm } from "@/components/tool-upload-form";
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/components/json-ld";
import { tools } from "@/lib/tools";
import { pageMetadata, toolDescription } from "@/lib/seo";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: toolSlug } = await params;
  const tool = tools.find((item) => item.slug === toolSlug);

  if (!tool) {
    return { title: "Tool not found", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: `${tool.name} — Free Online PDF Tool`,
    description: toolDescription(tool),
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolSlug } = await params;
  const tool = tools.find((item) => item.slug === toolSlug);

  if (!tool) {
    return (
      <section className="px-4 sm:px-6 py-12 max-w-4xl mx-auto">
        <div className="neo-card rounded-sm p-8 text-center">
          <div className="dept-tag mb-4">Errata</div>
          <h2 className="text-2xl font-display font-bold mb-2">Tool not found</h2>
          <p className="text-inksoft mb-4">Select a valid PDF tool from the homepage.</p>
          <Link
            href="/"
            className="inline-block neo-btn px-6 py-2 rounded-sm"
          >
            Browse all tools
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <JsonLd id="software-application-jsonld" data={softwareApplicationSchema(tool)} />
      <JsonLd
        id="breadcrumb-jsonld"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: tool.name, path: `/tools/${tool.slug}` },
        ])}
      />
      <div className="space-y-6">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-phantom">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-vermilion transition font-medium">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink font-medium">
                {tool.name}
              </li>
            </ol>
          </nav>
          <div className="dept-tag mt-4">Tool № {String(tools.findIndex((t) => t.slug === tool.slug) + 1).padStart(2, "0")}</div>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight mt-2">
            {tool.name}
          </h1>
          <p className="text-inksoft text-lg mt-2">{tool.description}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <ToolUploadForm tool={tool.slug} />
          </div>
          <div className="space-y-4">
            <div className="neo-card rounded-sm p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-ink mb-3">
                How it works
              </h3>
              <ol className="space-y-2 text-sm text-inksoft">
                <li className="flex gap-2">
                  <span className="w-5 h-5 border-2 border-ink bg-cream font-display font-bold text-vermilion flex items-center justify-center text-xs flex-shrink-0 shadow-offset-sm">
                    1
                  </span>
                  <span>Upload your PDF file(s)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 border-2 border-ink bg-cream font-display font-bold text-vermilion flex items-center justify-center text-xs flex-shrink-0 shadow-offset-sm">
                    2
                  </span>
                  <span>Configure options if needed</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 border-2 border-ink bg-cream font-display font-bold text-vermilion flex items-center justify-center text-xs flex-shrink-0 shadow-offset-sm">
                    3
                  </span>
                  <span>Download processed file</span>
                </li>
              </ol>
            </div>
            <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
              <div className="eyebrow mb-2">Security</div>
              <p className="text-xs">Files are processed locally and automatically deleted after 1 hour. We never share your data.</p>
            </div>
            <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
              <div className="eyebrow mb-2">Need help?</div>
              <p className="text-xs">
                Read the{" "}
                <Link href="/about" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
                  About page
                </Link>{" "}
                or{" "}
                <Link href="/contact" className="underline underline-offset-2 text-cobalt hover:text-vermilion transition">
                  contact support
                </Link>{" "}
                for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
