const toolCategories = [
  {
    name: "Basic Tools",
    tagline: "The essentials.",
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
    tagline: "Transfigurations.",
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
    tagline: "The red pencil.",
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
    tagline: "The vault.",
    tools: [
      { name: "Redact PDF", slug: "redact", description: "Black out sensitive areas" }
    ]
  },
  {
    name: "Advanced Tools",
    tagline: "The deep shelf.",
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
      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-12">
          {/* Cover story — the declaration */}
          <div className="space-y-5">
            <div className="dept-tag">The Tool Issue · Vol. 26</div>
            <h1 className="font-display text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight">
              Every document,
              <br />
              <span className="bg-vermilion text-cream px-3 -rotate-1 inline-block">
                set free.
              </span>
            </h1>
            <p className="text-inksoft max-w-2xl text-lg font-body">
              Convert, compress, edit, and manage your documents in one secure
              workspace. Twenty-six tools, no sign-up, free forever.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["26 PDF Tools", "Free Forever", "No Sign-up Required", "Secure & Private"].map(
                (item) => (
                  <span key={item} className="dept-tag !border-ink !shadow-offset-sm">
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {toolCategories.map((category, idx) => (
            <div key={category.name} className="space-y-4">
              <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {category.name}
                </h2>
                <span className="eyebrow hidden sm:block">{category.tagline}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {category.tools.map((tool, toolIdx) => (
                  <a
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="neo-card rounded-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-display text-lg font-bold leading-tight">
                        {tool.name}
                      </div>
                      <span className="font-display text-xs text-phantom whitespace-nowrap border border-ink px-1.5 py-0.5">
                        {String(toolIdx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-sm text-inksoft mt-2">{tool.description}</p>
                    <div className="text-sm font-display font-semibold text-vermilion mt-3">
                      Open →
                    </div>
                  </a>
                ))}
              </div>
              {idx === 0 && <div className="barcode" aria-hidden="true" />}
            </div>
          ))}
        </div>

        {/* Right rail — the cover lines of the issue */}
        <div className="space-y-6 lg:pt-10">
          <div id="fine-print" className="neo-card rounded-sm p-5 space-y-4 scroll-mt-24">
            <div className="eyebrow">The Fine Print</div>
            <div className="space-y-4">
              <div className="border-l-4 border-vermilion pl-3">
                <div className="font-display text-2xl font-bold">Free Plan</div>
                <p className="text-sm text-inksoft">5 files / day — perfect for occasional use</p>
              </div>
              <div className="border-l-4 border-cobalt pl-3">
                <div className="font-display text-2xl font-bold text-cobalt">Pro Plan</div>
                <p className="text-sm text-inksoft">Unlimited — for power users and teams</p>
              </div>
            </div>
          </div>

          <div className="neo-card rounded-sm p-5 text-sm text-inksoft">
            <div className="eyebrow mb-3">House Rules</div>
            <ul className="space-y-2">
              {[
                "Max 25MB file size",
                "Local file processing",
                "1-hour file retention",
                "No account required"
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-vermilion font-bold" aria-hidden="true">
                    ✓
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="neo-card bg-ink text-cream rounded-sm p-5">
            <div className="eyebrow !text-cream/70 mb-2">Readers’ Poll</div>
            <p className="font-display text-xl font-bold leading-snug">
              “The fastest sheet in the West.”
            </p>
            <p className="text-cream/70 text-xs mt-3">
              — A satisfied reader, on Merge PDFs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
