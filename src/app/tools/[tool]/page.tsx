import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ToolUploadForm } from "@/components/tool-upload-form";
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/components/json-ld";
import { getRelatedTools, getTool, tools, toolAccentHex } from "@/lib/tools";
import { pageMetadata, toolDescription } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: toolSlug } = await params;
  const tool = getTool(toolSlug);

  if (!tool) {
    return { title: "Tool not found", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: `${tool.name} — Free Online PDF Tool`,
    description: toolDescription(tool),
    path: `/tools/${tool.slug}`,
  });
}

export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolSlug } = await params;
  const tool = getTool(toolSlug);

  if (!tool) {
    return (
      <section className="px-4 sm:px-6 py-12 max-w-4xl mx-auto">
        <div className="neo-card rounded-sm p-8 text-center">
          <div className="dept-tag mb-4">Errata</div>
          <h2 className="text-2xl font-display font-bold mb-2">Tool not found</h2>
          <p className="text-inksoft mb-4">Select a valid PDF tool from the homepage.</p>
          <Link href="/" className="inline-block neo-btn px-6 py-2 rounded-sm">
            Browse all tools
          </Link>
        </div>
      </section>
    );
  }

  const related = getRelatedTools(tool.slug, 4);
  const toolNumber = String(tools.findIndex((t) => t.slug === tool.slug) + 1).padStart(2, "0");

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
          <div
            className="dept-tag mt-4"
            style={{ color: toolAccentHex[tool.accent] }}
          >
            Tool № {toolNumber}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight mt-2">
            {tool.name}
          </h1>
          <p className="text-inksoft text-lg mt-2">{tool.description}</p>
        </div>

        <Image
          src={`/tools/${tool.slug}.svg`}
          alt={`${tool.name} illustration — ${tool.description}`}
          width={1200}
          height={420}
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="w-full h-auto border-2 border-ink shadow-offset bg-paper"
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <ToolUploadForm tool={tool.slug} />

            <div className="neo-card rounded-sm p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink mb-3">
                What people use it for
              </h2>
              <ul className="space-y-2 text-sm text-inksoft">
                {tool.useCases.map((useCase) => (
                  <li key={useCase} className="flex items-start gap-2">
                    <span
                      className="font-bold"
                      style={{ color: toolAccentHex[tool.accent] }}
                      aria-hidden="true"
                    >
                      ▪
                    </span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <figure className="neo-card rounded-sm p-3">
              <Image
                src="/workflow.svg"
                alt="Three-step workflow: upload, process, download"
                width={1200}
                height={320}
                sizes="300px"
                className="w-full h-auto border-2 border-ink bg-paper"
              />
              <figcaption className="eyebrow text-center mt-2">
                Upload → Process → Download
              </figcaption>
            </figure>

            <div className="neo-card rounded-sm p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink mb-3">
                How it works
              </h2>
              <ol className="space-y-2 text-sm text-inksoft">
                {[
                  "Upload your PDF file(s)",
                  "Configure options if needed",
                  "Download processed file"
                ].map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span
                      className="w-5 h-5 border-2 border-ink bg-cream font-display font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-offset-sm"
                      style={{ color: toolAccentHex[tool.accent] }}
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
              <div className="eyebrow mb-2">Security</div>
              <p className="text-xs">
                Files are processed locally and automatically deleted after 1 hour.
                We never share your data.
              </p>
            </div>

            <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
              <div className="eyebrow mb-2">Need help?</div>
              <p className="text-xs">
                Read the{" "}
                <Link
                  href="/about"
                  className="underline underline-offset-2 text-cobalt hover:text-vermilion transition"
                >
                  About page
                </Link>{" "}
                or{" "}
                <Link
                  href="/contact"
                  className="underline underline-offset-2 text-cobalt hover:text-vermilion transition"
                >
                  contact support
                </Link>{" "}
                for assistance.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                More from the press
              </h2>
              <span className="eyebrow hidden sm:block">{tool.category}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/tools/${item.slug}`}
                  className="neo-card rounded-sm p-3 block"
                >
                  <Image
                    src={`/tools/${item.slug}.svg`}
                    alt={`${item.name} illustration`}
                    width={1200}
                    height={420}
                    sizes="(max-width: 640px) 100vw, 220px"
                    className="w-full h-auto border-2 border-ink mb-3 bg-paper"
                  />
                  <div
                    className="font-display text-base font-bold leading-tight"
                    style={{ color: toolAccentHex[item.accent] }}
                  >
                    {item.name}
                  </div>
                  <p className="text-xs text-inksoft mt-1">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
