import { AdSlot } from "@/components/ad-slot";

const toolCategories = [
  {
    name: "Basic Tools",
    tools: [
      { name: "Merge PDFs", slug: "merge", description: "Combine multiple PDFs into one" },
      { name: "Split PDF", slug: "split", description: "Extract pages or ranges" },
      { name: "Compress PDF", slug: "compress", description: "Reduce file size" },
      { name: "Rotate PDF", slug: "rotate", description: "Rotate pages by 90°/180°/270°" },
      { name: "Extract Pages", slug: "extract-pages", description: "Pull specific pages" },
      { name: "Delete Pages", slug: "delete-pages", description: "Remove specific pages" },
      { name: "Reorder Pages", slug: "reorder", description: "Change page order" }
    ]
  },
  {
    name: "Convert Tools",
    tools: [
      { name: "PDF to Text", slug: "pdf-to-text", description: "Extract text from PDF" },
      { name: "PDF to Images", slug: "pdf-to-images", description: "Export as JPG or PNG" },
      { name: "Images to PDF", slug: "images-to-pdf", description: "Convert JPG/PNG to PDF" },
      { name: "PDF to DOCX", slug: "pdf-to-office", description: "Convert to Word document" },
      { name: "PDF to HTML", slug: "pdf-to-html", description: "Convert to HTML" },
      { name: "OCR PDF", slug: "ocr", description: "Extract text from scanned PDFs" }
    ]
  },
  {
    name: "Edit Tools",
    tools: [
      { name: "Text Watermark", slug: "watermark-text", description: "Add text watermark" },
      { name: "Image Watermark", slug: "watermark-image", description: "Add image/logo watermark" },
      { name: "Text Annotations", slug: "annotate", description: "Add notes and highlights" },
      { name: "Add Page Numbers", slug: "page-numbers", description: "Number all pages" },
      { name: "Edit Metadata", slug: "metadata", description: "Edit title, author, subject" }
    ]
  },
  {
    name: "Security/Privacy",
    tools: [
      { name: "Redact PDF", slug: "redact", description: "Black out sensitive areas" }
    ]
  },
  {
    name: "Advanced Tools",
    tools: [
      { name: "Compare PDFs", slug: "compare", description: "Compare two PDFs" },
      { name: "Flatten PDF", slug: "flatten", description: "Remove interactivity" },
      { name: "N-up PDF", slug: "n-up", description: "2 or 4 pages per sheet" },
      { name: "Resize PDF", slug: "resize", description: "Change page size" },
      { name: "Booklet", slug: "booklet", description: "Reorder for booklet printing" },
      { name: "Repair PDF", slug: "repair", description: "Fix corrupted PDFs" },
      { name: "Extract Images", slug: "extract-images", description: "Get embedded images" }
    ]
  }
];

export default function HomePage() {
  return (
    <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-semibold">
              All-in-one PDF suite for modern teams
            </h1>
            <p className="text-slate-300 max-w-2xl text-lg">
              Convert, compress, edit, and manage your documents in one secure workspace. 
              All 24 PDF tools are production-ready and free to use.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24 PDF Tools
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free to Use
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No Sign-up Required
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure & Private
              </div>
            </div>
          </div>

          {toolCategories.map((category) => (
            <div key={category.name} className="space-y-4">
              <h2 className="text-2xl font-semibold">{category.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {category.tools.map((tool) => (
                  <a
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="gradient-border rounded-xl p-5 bg-panel hover:border-accent transition group"
                  >
                    <div className="text-lg font-medium group-hover:text-accent transition">
                      {tool.name}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{tool.description}</p>
                    <div className="text-xs text-accent mt-2 opacity-0 group-hover:opacity-100 transition">
                      Get started →
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 lg:mt-16">
          <AdSlot position="sidebar" />
          <div className="gradient-border rounded-xl p-5 bg-panel space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Free Plan</div>
              <p className="mt-2 text-2xl font-semibold">5 files / day</p>
              <p className="text-sm text-slate-400 mt-1">Perfect for occasional use</p>
            </div>
            <div className="h-px bg-slate-700" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent">Pro Plan</div>
              <p className="mt-2 text-2xl font-semibold text-accent">Unlimited</p>
              <p className="text-sm text-slate-400 mt-1">For power users and teams</p>
            </div>
          </div>

          <div className="gradient-border rounded-xl p-5 bg-panel text-xs text-slate-400">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">Features</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Max 25MB file size</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Local file processing</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>1-hour file retention</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No account required</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
